const { Op } = require('sequelize');
const { startOfDay, endOfDay } = require('date-fns'); // Import to get today's start and end times
const multer = require('multer');
const { Sequelize } = require('sequelize');
const asyncHandler = require("express-async-handler");
const adminModel = require("../models/adminModel")
const usersModel = require("../models/userModel");
const student_main_detailModel = require("../models/studentModel");
const { sendNotificationSingle } = require("../utils/SendNotification");

const {
  groupModel,
  subGroupModel,
  msgMasterModel,
  msgBodyModel, sendedMsgModel, studentMainDetailModel, schoolModel, RepliedMessageModel, RepliedMsgBodyModel
} = require("../models/associations");




// Toggle active/inactive status for a message in msgMasterModel

exports.toggleMessageStatus = async (req, res) => {
  try {
    const { msg_id } = req.query; // Get msg_id from request parameters

    // Find the message by ID
    const message = await msgMasterModel.findByPk(msg_id);

    if (!message) {
      return res.status(404).json({ status: false, message: 'Message not found' });
    }

    // Toggle the is_active status between 1 and 0
    message.is_active = message.is_active === 1 ? 0 : 1;
    // Save the updated status
    await message.save();

    res.status(200).json({
      status: true,
      message: `Message ${message.is_active ? 'activated' : 'deactivated'} successfully`,
      // message,
    });
  } catch (error) {
    console.error('Error toggling message active status:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};


exports.get_web_single_msg_master = asyncHandler(async (req, res) => {
  try {
    const { msg_id } = req.query; // Extract the msg_id from query parameters

    if (!msg_id) {
      return res.status(400).json({
        status: "error",
        message: "msg_id is required",
      });
    }

    // Fetch the single message by msg_id
    const msgMaster = await msgMasterModel.findOne({
      where: { msg_id: msg_id }, // Filter by msg_id
      include: [
        {
          model: subGroupModel, // Include subGroupModel to get msg_sgroup_mst
          include: [
            {
              model: groupModel, // Include groupModel within subGroupModel
            },
          ],
        },
        {
          model: msgBodyModel, // Include msgBodyModel to fetch data from msg_body
          order: [["ordersno", "ASC"]], // Order the results by ordersno
        },
      ],
    });

    // Check if data exists
    if (!msgMaster) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    // Prepare an array of school IDs for querying
    const schoolIds = msgMaster?.school_id
      ? msgMaster.school_id.split(",").map(Number)
      : [];

    // Fetch all matching school records for the extracted IDs
    const schools = await schoolModel.findAll({
      where: {
        sch_id: {
          [Op.in]: schoolIds, // Use Op.in to match multiple IDs
        },
      },
    });

    // Create a mapping of school IDs to their full data
    const schoolMapping = schools.reduce((acc, school) => {
      acc[school.sch_id] = school; // Store the entire school object
      return acc;
    }, {});

    // Add full school data to the msgMaster record
    const schoolData = schoolIds.map((id) => schoolMapping[id]).filter(Boolean);
    const msgMasterWithSchoolData = {
      ...msgMaster.toJSON(), // Convert Sequelize instance to plain object
      schools: schoolData, // Add full school data to the message object
    };

    // Return the single message with school data
    res.status(200).json({
      status: "success",
      data: msgMasterWithSchoolData,
    });
  } catch (error) {
    console.error("Error fetching msgMaster:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


exports.delete_web_single_msg_master = asyncHandler(async (req, res) => {
  try {
    const { msg_id } = req.query; // Extract the msg_id from query parameters

    if (!msg_id) {
      return res.status(400).json({
        status: "error",
        message: "msg_id is required",
      });
    }

    // Fetch the single message by msg_id
    const msgMaster = await msgMasterModel.findOne({
      where: { msg_id: msg_id },
    });


    // Check if message exists
    if (!msgMaster) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    // Update the is_active status to 0 (soft delete)
    msgMaster.is_active = 0;
    await msgMaster.save();

    // Return success response
    res.status(200).json({
      status: "success",
      message: "Message has been deactivated",
    });

  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});



exports.SentMsgToScholarData = asyncHandler(async (req, res) => {
  try {
    const { new_msg_id, admin_id, subject } = req.query;
    const selected_ids =
      req.body.selected_ids ||
      (req.query.selected_ids?.split(",").map((id) => id.trim()) || []);

    if (!new_msg_id) {
      return res.status(400).json({
        status: false,
        data: "",
        message: "Required Message Id",
      });
    }

    if (selected_ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No IDs provided for processing.",
      });
    }

    // Helper: Chunk array
    const chunkArray = (array, size) => {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    };

    const chunks = chunkArray(selected_ids, 50);
    let notificationResults = [];

    for (const chunk of chunks) {
      // Fetch students by scholar_no
      const students = await student_main_detailModel.findAll({
        where: { student_number: chunk },
      });

      for (const student of students) {
        const {
          student_family_mobile_number,
          student_number: scholar_no,
          sch_short_nm,
        } = student;

        // Split multiple mobile numbers (comma, space, semicolon supported)
        const mobileNumbers = student_family_mobile_number
          ? student_family_mobile_number
            .split(/[,; ]+/)
            .map((num) => num.trim())
            .filter((num) => num.length >= 10)
          : [];

        if (mobileNumbers.length === 0) {
          notificationResults.push({
            scholar_no,
            status: "no_mobile_number",
          });
          continue;
        }

        // Process each mobile number
        for (const mobile_no of mobileNumbers) {
          // Find user FCM token
          const user = await usersModel.findOne({
            where: { mobile_no },
            attributes: ["fcm_token"],
          });

          const fcm_token = user ? user.fcm_token : null;

          // Check if already exists
          const existingRecord = await sendedMsgModel.findOne({
            where: { msg_id: new_msg_id, mobile_no, scholar_no },
          });

          if (existingRecord) {
            await existingRecord.update({
              scholar_no,
              sch_short_nm: sch_short_nm || null,
              sended_date: new Date(),
              sended_by: admin_id,
            });
          } else {
            await sendedMsgModel.create({
              mobile_no,
              scholar_no,
              sch_short_nm: sch_short_nm || null,
              msg_id: new_msg_id,
              sended_date: new Date(),
              sended_by: admin_id,
              is_fcm_sended: 0,
              is_seen: 0,
              is_starred: 0,
            });
          }

          // Send FCM notification if token available
          if (fcm_token) {
            try {
              await sendNotificationSingle(
                fcm_token,
                `New Message : ${subject}`,
                "default_channel",
                null
              );
              notificationResults.push({
                scholar_no,
                mobile_no,
                status: "success",
              });
            } catch (error) {
              notificationResults.push({
                scholar_no,
                mobile_no,
                status: "failed",
                error: error.message,
              });
            }
          } else {
            notificationResults.push({
              scholar_no,
              mobile_no,
              status: "no_device_token",
            });
          }
        }
      }
    }

    // --- Recalculate unique recipients AFTER all sends ---
    const uniqueRecipients = await sendedMsgModel.count({
      where: { msg_id: new_msg_id },
      distinct: true,
      col: "scholar_no",
    });

    await msgMasterModel.update(
      { no_of_recipients: uniqueRecipients },
      { where: { msg_id: new_msg_id } }
    );


    res.status(200).json({
      status: "success",
      message: "Messages sent and notifications processed successfully",
      totalRecipients: selected_ids.length,
      notificationResults,
    });
  } catch (error) {
    console.error("Error sending messages:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});






// send direct api for client 



exports.SendDirectMessage = asyncHandler(async (req, res) => {
  try {
    const { new_msg_id, subject } = req.query;
    const student_ids =
      req.body.student_ids ||
      (req.query.student_ids?.split(",").map((id) => id.trim()) || []);

    if (!new_msg_id) {
      return res.status(400).json({
        status: false,
        data: "",
        message: "Required Message Id",
      });
    }

    if (student_ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No student IDs provided for processing.",
      });
    }

    // Helper to chunk large arrays for better performance
    const chunkArray = (array, size) => {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    };

    const chunks = chunkArray(student_ids, 50);
    let notificationResults = [];

    for (const chunk of chunks) {
      // Fetch student records by their numbers
      const students = await student_main_detailModel.findAll({
        where: { student_number: chunk },
      });

      for (const student of students) {
        const {
          student_family_mobile_number,
          student_number: scholar_no,
          sch_short_nm,
        } = student;

        // Split multiple mobile numbers (comma, space, semicolon supported)
        const mobileNumbers = student_family_mobile_number
          ? student_family_mobile_number
            .split(/[,; ]+/)
            .map((num) => num.trim())
            .filter((num) => num.length >= 10)
          : [];

        if (mobileNumbers.length === 0) {
          notificationResults.push({
            scholar_no,
            status: "no_mobile_number",
          });
          continue;
        }

        // Send to each valid mobile number
        for (const mobile_no of mobileNumbers) {
          // Fetch user's FCM token
          const user = await usersModel.findOne({
            where: { mobile_no },
            attributes: ["fcm_token"],
          });

          const fcm_token = user ? user.fcm_token : null;

          // Check if already exists
          const existingRecord = await sendedMsgModel.findOne({
            where: { msg_id: new_msg_id, mobile_no, scholar_no },
          });

          if (existingRecord) {
            // Update existing record
            await existingRecord.update({
              scholar_no,
              sch_short_nm: sch_short_nm || null,
              sended_date: new Date(),
              sended_by: 0,
              is_fcm_sended: 0,
              is_seen: 0,
              is_starred: 0,
            });
          } else {
            // Create a new record
            await sendedMsgModel.create({
              mobile_no,
              scholar_no,
              sch_short_nm: sch_short_nm || null,
              msg_id: new_msg_id,
              sended_date: new Date(),
              sended_by: 0,
              is_fcm_sended: 0,
              is_seen: 0,
              is_starred: 0,
            });
          }

          // Send FCM notification if available
          if (fcm_token) {
            try {
              await sendNotificationSingle(
                fcm_token,
                `New Message: ${subject}`,
                "default_channel",
                null
              );
              notificationResults.push({
                scholar_no,
                mobile_no,
                status: "success",
              });
            } catch (error) {
              notificationResults.push({
                scholar_no,
                mobile_no,
                status: "failed",
                error: error.message,
              });
            }
          } else {
            notificationResults.push({
              scholar_no,
              mobile_no,
              status: "no_device_token",
            });
          }
        }
      }
    }

    // Update total recipient count in message master
    await msgMasterModel.update(
      { no_of_recipients: student_ids.length },
      { where: { msg_id: new_msg_id } }
    );

    res.status(200).json({
      status: "success",
      message: "Messages sent and notifications processed successfully",
      studentsProcessed: student_ids.length,
      notificationResults,
    });
  } catch (error) {
    console.error("Error sending messages:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


// send direct api for client 


exports.getmsgMaster = asyncHandler(async (req, res) => {
  try {
    const { page, limit, access_id } = req.query;

    const isPagination = page && limit;
    let msgMaster;
    let totalCount;

    const filter = {};
    if (access_id) {
      const accessIds = access_id.split(',').map(id => parseInt(id, 10));
      filter.entry_by = {
        [Op.in]: accessIds,
      };
    }

    if (isPagination) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      msgMaster = await msgMasterModel.findAll({
        where: filter,
        include: [
          {
            model: subGroupModel,
            include: [
              {
                model: groupModel,
              },
            ],
          },
          {
            model: msgBodyModel,
            order: [["ordersno", "ASC"]],
          },
        ],
        order: [["msg_id", "DESC"]],
        limit: limitNum,
        offset: offset,
      });

      totalCount = await msgMasterModel.count({ where: filter });
    } else {
      msgMaster = await msgMasterModel.findAll({
        where: filter,
        include: [
          {
            model: subGroupModel,
            include: [
              {
                model: groupModel,
              },
            ],
          },
          {
            model: msgBodyModel,
            order: [["ordersno", "ASC"]],
          },
        ],
        order: [["msg_id", "DESC"]],
      });

      totalCount = msgMaster.length;
    }

    if (msgMaster.length > 0) {
      // Update seen_count and is_reply_done for each message
      for (const msg of msgMaster) {
        // Count seen messages
        const seenCount = await sendedMsgModel.count({
          where: { msg_id: msg.msg_id, is_seen: 1 },
        });

        // Count reply-done messages
        const replyDoneCount = await sendedMsgModel.count({
          where: { msg_id: msg.msg_id, is_reply_done: 1 },
        });

        // Update msgMasterModel with seen_count and is_reply_done
        await msgMasterModel.update(
          {
            seen: seenCount,
            respond: replyDoneCount
          },
          { where: { msg_id: msg.msg_id } }
        );
      }

      // Prepare school IDs
      const schoolIds = msgMaster.flatMap(msg =>
        msg?.school_id ? msg.school_id.split(',').map(Number) : []
      );

      const schools = await schoolModel.findAll({
        where: {
          sch_id: {
            [Op.in]: schoolIds,
          },
        },
      });

      const schoolMapping = schools.reduce((acc, school) => {
        acc[school.sch_id] = school;
        return acc;
      }, {});

      const entryByIds = [...new Set(msgMaster.map(msg => msg.entry_by))];
      const editByIds = [...new Set(msgMaster.map(msg => msg.edit_by))];
      const userIds = [...new Set([...entryByIds, ...editByIds])];

      const admins = await adminModel.findAll({
        where: {
          admin_id: {
            [Op.in]: userIds,
          },
        },
      });

      const adminMapping = admins.reduce((acc, admin) => {
        acc[admin.admin_id] = admin;
        return acc;
      }, {});

      const msgMasterWithDetails = msgMaster.map(msg => {
        const ids = msg.school_id ? msg.school_id.split(',').map(Number) : [];
        const schoolData = ids.map(id => schoolMapping[id]).filter(Boolean);
        const entryByData = adminMapping[msg.entry_by] || '';
        const editByData = adminMapping[msg.edit_by] || '';

        return {
          ...msg.toJSON(),
          schools: schoolData,
          entryByDetails: entryByData,
          editByDetails: editByData,
        };
      });

      res.status(200).json({
        status: "success",
        data: msgMasterWithDetails,
        pagination: isPagination
          ? {
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
            limit: parseInt(limit, 10),
          }
          : null,
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "No Data Found",
        data: null,
        pagination: isPagination
          ? {
            currentPage: parseInt(page, 10),
            totalPages: 0,
            limit: parseInt(limit, 10),
          }
          : null,
      });
    }
  } catch (error) {
    console.error("Error fetching msgMaster:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});





exports.getmsgbody = asyncHandler(async (req, res) => {
  try {
    const msgBody = await MsgBodyModel.findAll({});

    res.status(200).json({
      status: "success",
      data: msgBody,
    });
  } catch (error) {
    console.error("Error fetching msgBody with msgBody:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});






// ============================ App Related app ki api start ===================================
// ============================ App Related app ki api start ===================================




exports.get_Single_Msg_master_Detail_by_msg_id = asyncHandler(async (req, res) => {
  try {
    const { msg_id, sended_msg_id } = req.query;
    if (!msg_id || !sended_msg_id) {
      res.status(200).json({
        status: false,
        length: 0,
        data: null, message: "msg_id & sended_msg_id Required"
      });
    }
    // ========================================

    // Step 1: Update the is_seen status for the specified message
    const change = await sendedMsgModel.update(
      { is_seen: 1, seen_on: new Date() }, // Set is_seen to 1
      {
        where: {
          sended_msg_id: sended_msg_id,
        },
      }
    );
    const getSendedmessDetail = await sendedMsgModel.findOne({ where: { sended_msg_id: sended_msg_id }, });
    // ========================================
    const msgMaster = await msgMasterModel.findOne({ where: { msg_id: msg_id }, }, {
      include: [
        {
          model: subGroupModel, // Include the subGroupModel to get msg_sgroup_mst
          include: [
            {
              model: groupModel, // Include the groupModel within subGroupModel
            },
          ],
        },
        {
          model: msgBodyModel, // Include the msgBodyModel to fetch data from msg_body
          order: [["ordersno", "ASC"]], // Order the results by ordersno
        },
      ],
    });

    const msgMaster_body = await msgBodyModel.findAll({ where: { msg_id: msg_id }, order: [['ordersno', 'ASC']], });
    //  ==100 % working code start
    // const parsedMsgMasterBody = msgMaster_body.map((msg) => {
    //   return {
    //     ...msg.toJSON(), // Ensure sequelize data is converted to a plain object
    //     data_text: JSON.parse(msg.data_text), // Parse data_text from string to JSON
    //   };
    // });
    // 100 % working code end 
    const parsedMsgMasterBody = msgMaster_body.map((msg) => {
      const dataText = JSON.parse(msg.data_text);

      if (dataText.options && typeof dataText.options === 'string') {
        // Convert the options from a semicolon-separated string to an array of objects
        const optionsArray = dataText.options
          .split(';')
          .filter(option => option.trim() !== '') // Remove any empty options
          .map((option, index) => ({
            [`option`]: option.trim() // Use dynamic keys for option1, option2, etc.
            // [`option${index + 1}`]: option.trim() // Use dynamic keys for option1, option2, etc.
          }));

        // Update data_text with the new options array
        dataText.options = optionsArray;
      }

      return {
        ...msg.toJSON(),
        data_text: dataText,
      };
    });
    // here i want to update if priority is 4 5
    if (msgMaster?.msg_priority === 4 || msgMaster?.msg_priority === 5) {

      const change2 = await sendedMsgModel.update(
        { is_starred: 1 },
        {
          where: {
            sended_msg_id: sended_msg_id,
          },
        }
      );

    }
    if (msgMaster) {
      res.status(200).json({
        status: true,

        data: { msg_detail: msgMaster, msg_body: parsedMsgMasterBody, is_reply_done: getSendedmessDetail.is_reply_done === 1 ? 1 : 0 },
      });
    }
    else {
      res.status(200).json({
        status: false,
        data: { msg_detail: msgMaster, msg_body: msgMaster_body },
      });
    }
  } catch (error) {
    console.error("Error fetching msgMaster with msgMaster:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

exports.get_Single_Msg_master_Detail_by_msg_ids = asyncHandler(async (req, res) => {
  try {

    const { msg_id, sended_msg_id } = req.query;
    if (!msg_id || !sended_msg_id) {
      return res.status(200).json({
        status: false,
        length: 0,
        data: null, message: "msg_id & sended_msg_id Required"
      });
    }

    // Step 1: Update the is_seen status for the specified message
    const change = await sendedMsgModel.update(
      { is_seen: 1, seen_on: new Date() }, // Set is_seen to 1
      {
        where: {
          sended_msg_id: sended_msg_id,
        },
      }
    );


    const getSendedmessDetail = await sendedMsgModel.findOne({ where: { sended_msg_id: sended_msg_id }, });
    // ========================================
    const msgMaster = await msgMasterModel.findOne({ where: { msg_id: msg_id }, }, {
      include: [
        {
          model: subGroupModel, // Include the subGroupModel to get msg_sgroup_mst
          include: [
            {
              model: groupModel, // Include the groupModel within subGroupModel
            },
          ],
        },
        {
          model: msgBodyModel, // Include the msgBodyModel to fetch data from msg_body
          order: [["ordersno", "ASC"]], // Order the results by ordersno
        },
      ],
    });

    const msgMaster_body = await msgBodyModel.findAll({ where: { msg_id: msg_id }, order: [['ordersno', 'ASC']], });

    // Grouping the msg_body by msg_type
    const groupedMsgBody = msgMaster_body.reduce((acc, msg) => {
      const msgType = msg.msg_type;
      if (!acc[msgType]) {
        acc[msgType] = [];
      }

      const dataText = JSON.parse(msg.data_text);

      // Handle options if present in data_text
      if (dataText.options && typeof dataText.options === 'string') {
        const optionsArray = dataText.options
          .split(';')
          .filter(option => option.trim() !== '')
          .map((option) => ({ option: option.trim() }));
        dataText.options = optionsArray;
      }

      acc[msgType].push({
        ...msg.toJSON(),
        data_text: dataText,
      });

      return acc;
    }, {});


    // here i want to update if priority is 4 5
    if (msgMaster?.msg_priority === 4 || msgMaster?.msg_priority === 5) {

      const change2 = await sendedMsgModel.update(
        { is_starred: 1 },
        {
          where: {
            sended_msg_id: sended_msg_id,
          },
        }
      );

    }
    // Format the grouped data into an array
    const formattedMsgBody = Object.keys(groupedMsgBody).map(msgType => ({
      msg_type: msgType,
      data: groupedMsgBody[msgType],
    }));

    if (msgMaster) {
      res.status(200).json({
        status: true,
        data: {
          msg_detail: msgMaster,
          msg_body: formattedMsgBody,
          is_reply_done: getSendedmessDetail.is_reply_done === 1 ? 1 : 0
        },
      });
    } else {
      res.status(200).json({
        status: false,
        data: { msg_detail: msgMaster, msg_body: msgMaster_body },
      });
    }
  } catch (error) {
    console.error("Error fetching msgMaster with msgMaster:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


exports.getSingleMsgDetail = asyncHandler(async (req, res) => {
  try {
    const { sended_msg_id } = req.params;

    // Step 1: Update the is_seen status for the specified message
    const change = await sendedMsgModel.update(
      { is_seen: 1, seen_on: new Date() }, // Set is_seen to 1
      {
        where: {
          sended_msg_id: sended_msg_id,
        },
      }
    );

    const msgSendedMaster = await sendedMsgModel.findOne({
      limit: 100,
      order: [['sended_msg_id', 'DESC']],
      where: {
        sended_msg_id: sended_msg_id // Replace with the mobile number you want to filter by
      },
      include: [
        {
          model: msgMasterModel, // Include the subGroupModel to get msg_sgroup_mst
        },
        {
          model: studentMainDetailModel, // Join with studentMainDetailModel
          as: 'student', // Use the alias 'student' from the association
          // attributes: ['student_name'], // Fetch only the student_name
        },
        {
          model: msgBodyModel, // Include msg_body details
          as: 'msgBody', // Use the alias defined in the association
          required: true, // Ensures that it only returns records with matching msg_id
          where: {
            msg_id: Sequelize.col('sended_msg.msg_id'), // Adjust this to use the correct column reference
          },
        },
        // {
        //   model: msgBodyModel, // Join with msgBodyModel to get the message body
        //   as: 'messageBody', // Alias for the join
        // //  attributes: ['msg_body'], // Fetch only the msg_body field
        // }
      ],
    });

    if (msgSendedMaster) {
      res.status(200).json({
        status: true,
        length: msgSendedMaster.length,
        data: msgSendedMaster,
      });
    }
    else {
      res.status(200).json({
        status: false,
        length: msgSendedMaster.length,
        data: msgSendedMaster,
      });
    }
  } catch (error) {
    console.error("Error fetching msgMaster with msgMaster:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});



exports.seenStatusUpdateMsgDetail = asyncHandler(async (req, res) => {
  try {
    const { sended_msg_id } = req.params;


    // Step 1: Update the is_seen status for the specified message
    const change = await sendedMsgModel.update(
      { is_seen: 1, seen_on: new Date() }, // Set is_seen to 1
      {
        where: {
          sended_msg_id: sended_msg_id,
        },
      }
    );

    // Step 2: Check if the update was successful
    if (change[0] === 0) {
      // No rows were updated, meaning the sended_msg_id might not exist
      return res.status(200).json({
        status: false,
        message: "Message not found or already seen",
      });
    }

    // Step 3: Return a success response
    res.status(200).json({
      status: true,
      message: "Seen status updated successfully",
    });

  } catch (error) {
    console.error("Error fetching msgMaster with msgMaster:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});



exports.staredStatusUpdateMsgDetail = asyncHandler(async (req, res) => {
  try {
    const { sended_msg_id } = req.params;
    const { star_status } = req.body;


    // Step 1: Update the is_seen status for the specified message
    const change = await sendedMsgModel.update(
      { is_starred: star_status, starred_on: new Date() }, // Set is_seen to 1
      {
        where: {
          sended_msg_id: sended_msg_id,
        },
      }
    );

    // Step 2: Check if the update was successful
    if (change[0] === 0) {
      // No rows were updated, meaning the sended_msg_id might not exist
      return res.status(200).json({
        status: false,
        message: "Message not found or already Starred",
      });
    }

    // Step 3: Return a success response
    res.status(200).json({
      status: true,
      message: "Starred status updated successfully",
    });

  } catch (error) {
    console.error("Error fetching :", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


// App Only Use 

exports.getSearchDetail = asyncHandler(async (req, res) => {
  try {
    const { mobile, searchquery } = req.query;

    // Check if mobile number is provided
    if (!mobile) {
      return res.status(400).json({
        status: false,
        message: "Mobile number is required",
      });
    }

    // Set up the where clause for the query
    const whereClause = {
      mobile_no: mobile,
    };

    // If search query is provided, add it to the where clause
    if (searchquery) {
      whereClause[Sequelize.Op.and] = [
        ...whereClause[Sequelize.Op.and] || [],
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('msg_mst.subject_text')), {
          [Sequelize.Op.like]: `%${searchquery.toLowerCase()}%`, // Use lower case for both column and query
        }),
      ];
    }

    const msgSendedMaster = await sendedMsgModel.findAll({
      limit: 100, // Adjust limit as needed
      order: [['sended_msg_id', 'DESC']],
      where: whereClause,
      include: [
        {
          model: msgMasterModel, // Include message master model
          // attributes: ['subject_text'], // Uncomment if you want to fetch only specific fields
        },
        {
          model: studentMainDetailModel, // Include student details model
          as: 'student', // Use the alias 'student' from the association
          // attributes: ['student_name'], // Uncomment if you want to fetch only specific fields
        },
      ],
    });

    // Return the results
    if (msgSendedMaster.length === 0) {
      return res.status(200).json({
        status: false,
        length: 0,
        message: "No messages found",
        data: [],
      });
    }

    return res.status(200).json({
      status: true,
      length: msgSendedMaster.length,
      message: "Work available",
      data: msgSendedMaster,
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});




// ============================ App Related app ki api End ===================================
// ============================ App Related app ki api End ===================================

//====================== Group =================================





exports.addSingleGroupData = asyncHandler(async (req, res) => {
  try {
    const { msg_group_name, is_active, added_user_id } = req.body;

    // Validate the required fields
    if (!msg_group_name || !is_active || !added_user_id) {
      return res.status(400).json({
        status: "error",
        message:
          "Please provide all required fields: msg_group_name, is_active, and added_user_id",
      });
    }

    // Create a new group entry in the database
    const newGroup = await groupModel.create({
      msg_group_name,
      is_active,
      added_date: new Date(), // Automatically set the added_date to the current date
      added_user_id,
    });

    // Return a success response with the new group data
    res.status(201).json({
      status: "success",
      message: "Group created successfully",
      data: newGroup,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

exports.updateSingleGroupData = asyncHandler(async (req, res) => {
  try {
    const { msg_group_id } = req.params; // Get the group ID from the URL params
    const { msg_group_name, is_active, edited_user_id } = req.body; // Get the updated details from the request body

    // Check if the group ID is provided
    if (!msg_group_id) {
      return res.status(400).json({
        status: "error",
        message: "Group ID is required to update the group",
      });
    }

    // Find the group by ID
    const group = await groupModel.findByPk(msg_group_id);

    if (!group) {
      return res.status(404).json({
        status: "error",
        message: "Group not found",
      });
    }

    // Update the group details
    await group.update({
      msg_group_name: msg_group_name || group.msg_group_name, // Keep existing name if not provided
      is_active: is_active !== undefined ? is_active : group.is_active, // Keep existing status if not provided
      edited_date: new Date(), // Set current date for the edit
      edited_user_id: edited_user_id || group.edited_user_id, // Keep existing user if not provided
    });

    // Return a success response
    res.status(200).json({
      status: "success",
      message: "Group updated successfully",
      data: group,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});
// GetAll Group
exports.getGroupData = asyncHandler(async (req, res) => {
  try {
    // Extract pagination parameters from the query
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to limit of 10 if not provided
    const offset = (page - 1) * limit; // Calculate the offset for pagination

    // Fetch records with pagination
    const Groups = await groupModel.findAll({
      where: {
        is_deleted: 0, // Filter to exclude deleted records
      },
      limit: limit, // Apply limit for pagination
      offset: offset, // Apply offset for pagination
    });

    // Fetch the total count of records
    const totalCount = await groupModel.count(
      {
        where: {
          is_deleted: 0, // Filter to exclude deleted records
        },
      }); // Get total count of records for pagination

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit); // Calculate total pages based on count and limit

    // Check if any data exists
    if (Groups.length > 0) {
      res.status(200).json({
        status: "success",
        data: Groups,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          limit: limit,
        },
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "No Data Found",
        data: null,
        pagination: {
          currentPage: page,
          totalPages: 0, // No pages if no data is found
          limit: limit,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


exports.getSingleGroupData = asyncHandler(async (req, res) => {
  try {
    // Get the group ID from the request parameters
    const { id } = req.params;

    // Fetch the group by msg_group_id
    const group = await groupModel.findOne({
      where: { msg_group_id: id },
      // Optionally, include subgroups if needed
      // include: [{
      //   model: subGroupModel,
      //   attributes: ['msg_sub_group_id', 'msg_sub_group_name'],
      // }],
    });

    // Check if group exists
    if (!group) {
      return res.status(404).json({
        status: "error",
        message: `Group with id ${id} not found`,
      });
    }

    // Return the group data if found
    res.status(200).json({
      status: "success",
      data: group,
    });
  } catch (error) {
    console.error("Error fetching group by id:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

//======================= Sub Group ============================

// Add new subgroup
exports.addSubGroup = asyncHandler(async (req, res) => {
  try {
    // Get the details from the request body
    const { msg_sgroup_name, is_active, added_user_id, msg_group_id } =
      req.body;

    // Validate required fields
    if (!msg_sgroup_name || !msg_group_id) {
      return res.status(400).json({
        status: "error",
        message: "Subgroup name and group ID are required",
      });
    }

    // Create a new subgroup entry
    const newSubGroup = await subGroupModel.create({
      msg_sgroup_name,
      is_active: is_active || "1", // Default to active if not provided
      added_date: new Date(),
      added_user_id,
      msg_group_id,
    });

    // Send response back
    res.status(201).json({
      status: "success",
      message: "Subgroup created successfully",
      data: newSubGroup,
    });
  } catch (error) {
    console.error("Error creating subgroup:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get single subgroup detail by ID
exports.getSingleSubGroup = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find the subgroup by ID
    const subGroup = await subGroupModel.findOne({
      where: { msg_sgroup_id: id },
    });

    // If subgroup not found, return 404
    if (!subGroup) {
      return res.status(404).json({
        status: "error",
        message: "Subgroup not found",
      });
    }

    // Return the subgroup data
    res.status(200).json({
      status: "success",
      data: subGroup,
    });
  } catch (error) {
    console.error("Error fetching subgroup:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

exports.getSubGroupData = asyncHandler(async (req, res) => {
  try {
    // Extract page and limit from query parameters
    const { page, limit } = req.query;

    // Determine if pagination is required
    const isPagination = page && limit;
    let subGroups;
    let totalCount;

    if (isPagination) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Fetch total record count for calculating total pages
      totalCount = await subGroupModel.count({ where: { is_deleted: 0 } });

      // Fetch paginated records from the subGroupModel
      subGroups = await subGroupModel.findAll({
        include: [
          {
            model: groupModel,
            attributes: ["msg_group_id", "msg_group_name"],
          },
        ],
        where: { is_deleted: 0 },
        limit: limitNum,
        offset: offset,
      });
    } else {
      // Fetch all records if pagination is not specified
      subGroups = await subGroupModel.findAll({
        include: [
          {
            model: groupModel,
            attributes: ["msg_group_id", "msg_group_name"],
          },
        ],
        where: { is_deleted: 0 },
      });

      // Set total record count as the number of fetched records
      totalCount = subGroups.length;
    }

    // Check if any data exists
    if (subGroups.length > 0) {
      const totalPages = isPagination
        ? Math.ceil(totalCount / parseInt(limit, 10))
        : null; // Total pages only relevant with pagination

      res.status(200).json({
        status: "success",
        data: subGroups,
        pagination: isPagination
          ? {
            currentPage: parseInt(page, 10),
            totalPages: totalPages,
            totalRecords: totalCount,
            limit: parseInt(limit, 10),
          }
          : null, // No pagination details if not applicable
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "No Data Found",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error fetching subgroups with groups:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});



// Update subgroup detail by ID
exports.updateSubGroup = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      msg_sgroup_name,
      is_active,
      msg_group_id,
      edited_user_id
    } = req.body; // Extract required fields from the request body

    // Find the subgroup by ID and update its details
    const [updated] = await subGroupModel.update(
      {
        msg_sgroup_name,
        is_active,
        msg_group_id,
        edited_user_id,      // Update edited_user_id
        edited_date: new Date(), // Update the edited_date to current date
        updatedAt: new Date(), // Update the timestamp
      },
      {
        where: { msg_sgroup_id: id },
      }
    );

    // If no rows were updated, return 404
    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Subgroup not found or no changes made',
      });
    }

    // Fetch the updated subgroup details
    const updatedSubGroup = await subGroupModel.findOne({
      where: { msg_sgroup_id: id },
    });

    // Return the updated subgroup data
    res.status(200).json({
      status: 'success',
      data: updatedSubGroup,
    });
  } catch (error) {
    console.error('Error updating subgroup:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
});


// Delete group (soft delete by updating is_deleted status)
exports.deleteGroup = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // Get the group ID from the URL parameters

    // Find the group by ID
    const group = await groupModel.findOne({
      where: {
        msg_group_id: id,
      },
    });

    // Check if the group exists
    if (!group) {
      return res.status(404).json({
        status: false,
        message: "Group not found",
      });
    }

    // Update the is_deleted status to 1
    group.is_deleted = 1;
    await group.save(); // Save the updated instance

    // Return success response
    return res.status(200).json({
      status: true,
      message: "Group deleted successfully",
      data: group,
    });

  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

exports.deleteSubGroup = asyncHandler(async (req, res) => {
  const { msg_sgroup_id } = req.params; // Get the subgroup ID from request parameters

  try {
    // Find the subgroup by ID
    const subgroup = await subGroupModel.findOne({
      where: {
        msg_sgroup_id: msg_sgroup_id,
        is_deleted: 0, // Ensure the subgroup is not already deleted
      },
    });

    // Check if the subgroup exists
    if (!subgroup) {
      return res.status(404).json({
        status: false,
        message: "Subgroup not found or already deleted.",
      });
    }

    // Update the is_deleted status to 1
    subgroup.is_deleted = 1;
    await subgroup.save(); // Save the updated subgroup

    // Return success response
    return res.status(200).json({
      status: true,
      message: "Subgroup deleted successfully.",
      data: subgroup,
    });

  } catch (error) {
    console.error("Error deleting subgroup:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

exports.searchGroups = asyncHandler(async (req, res) => {
  try {
    const { searchquery, page = 1, limit = 10 } = req.query;

    // Check if search query is provided
    if (!searchquery) {
      return res.status(400).json({
        status: false,
        message: "searchquery is required",
      });
    }

    // Calculate the offset based on the current page and limit
    const offset = (page - 1) * limit;

    // Search query for groups
    const whereClause = {
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('msg_group_name')), {
          [Sequelize.Op.like]: `%${searchquery.toLowerCase()}%`, // Case-insensitive search on group name
        }),
        { is_deleted: 0 } // Only include undeleted groups
      ],
    };

    // Fetch the total number of matching records (for pagination)
    const totalRecords = await groupModel.count({
      where: whereClause,
    });

    // Fetch the paginated records that match the search query
    const groups = await groupModel.findAll({
      where: whereClause, // Apply search query filter
      limit: parseInt(limit), // Limit the number of results per page
      offset: parseInt(offset), // Skip records for pagination
      order: [['msg_group_id', 'DESC']], // Order by group ID in descending order
    });

    // Return the results
    if (groups.length === 0) {
      return res.status(200).json({
        status: false,
        length: 0,
        message: "No groups found",
        data: [],
      });
    }

    return res.status(200).json({
      status: true,
      length: groups.length,
      totalRecords, // Include the total number of matching records
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalRecords / limit), // Calculate total pages
      message: "Groups found",
      data: groups,
    });

  } catch (error) {
    console.error("Error fetching groups:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

exports.searchSubGroups = asyncHandler(async (req, res) => {
  try {
    const { searchquery, page = 1, limit = 10 } = req.query;

    // Check if search query is provided
    if (!searchquery) {
      return res.status(400).json({
        status: false,
        message: "searchquery is required",
      });
    }

    // Calculate the offset based on the current page and limit
    const offset = (page - 1) * limit;

    // Search query for subgroups
    const whereClause = {
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('msg_sgroup_name')), {
          [Sequelize.Op.like]: `%${searchquery.toLowerCase()}%`, // Case-insensitive search on subgroup name
        }),
        { is_deleted: 0 } // Only include undeleted subgroups
      ],
    };

    // Fetch the total number of matching records (for pagination)
    const totalRecords = await subGroupModel.count({
      where: whereClause,
    });

    // Fetch the paginated records that match the search query
    const subGroups = await subGroupModel.findAll({
      where: whereClause, // Apply search query filter
      limit: parseInt(limit), // Limit the number of results per page
      offset: parseInt(offset), // Skip records for pagination
      order: [['msg_sgroup_id', 'DESC']], // Order by subgroup ID in descending order
    });

    // Return the results
    if (subGroups.length === 0) {
      return res.status(200).json({
        status: false,
        length: 0,
        message: "No subgroups found",
        data: [],
      });
    }

    return res.status(200).json({
      status: true,
      length: subGroups.length,
      totalRecords, // Include the total number of matching records
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalRecords / limit), // Calculate total pages
      message: "Subgroups found",
      data: subGroups,
    });

  } catch (error) {
    console.error("Error fetching subgroups:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});
// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check the file's MIME type to determine the storage location
    if (file.mimetype === 'application/pdf') {
      cb(null, 'Uploads/pdf/'); // PDF files go to the 'pdf' folder
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, 'Uploads/image/'); // Images go to the 'image' folder
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.')); // Handle invalid types
    }
  },
  filename: (req, file, cb) => {
    // Remove spaces from the original file name
    const fileName = file.originalname.replace(/\s+/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + fileName); // Use unique filename to prevent conflicts
  }
});

const upload = multer({ storage });


exports.uploadFiles = upload.any();


exports.insertRepliedMessageAndBodies = asyncHandler(async (req, res) => {
  try {
    const { msg_id, mobile_no, student_main_id, student_number, sended_msg_id, replyBodies } = req.body;

    // Validate required fields for RepliedMessageModel
    if (!msg_id || !mobile_no) {
      return res.status(400).json({
        status: false,
        message: "msg_id and mobile_no are required",
      });
    }

    // Validate that replyBodies is an array
    if (!Array.isArray(replyBodies) || replyBodies.length === 0) {
      return res.status(400).json({
        status: false,
        message: "replyBodies must be a non-empty array",
      });
    }

    // Insert into RepliedMessageModel
    const newRepliedMessage = await RepliedMessageModel.create({
      sended_msg_id: sended_msg_id,
      msg_id,
      mobile_no, student_main_id, student_number,
      reply_date_time: new Date(), // Defaults to current date if not provided
    });

    // Get the newly inserted replied_msg_id
    const replied_msg_id = newRepliedMessage.replied_msg_id;

    // Prepare bulk insert data for RepliedMsgBodyModel
    const bodyInsertData = replyBodies.map((body) => ({
      replied_msg_id: replied_msg_id, // Use the replied_msg_id from newRepliedMessage
      msg_body_id: body.msg_body_id, // Assuming body contains msg_body_id
      msg_type: body.msg_type, // Assuming msg_type is present in the body
      data_reply_text: body.data_reply_text, // Body text for each entry
    }));

    // Bulk insert into RepliedMsgBodyModel
    const newRepliedMsgBodies = await RepliedMsgBodyModel.bulkCreate(bodyInsertData);

    const result = await sendedMsgModel.update(
      {
        is_reply_done: 1,
        reply_on: new Date() // Sets the current date and time
      },
      {
        where: { sended_msg_id: sended_msg_id }
      }
    );
    // Return success response with data from both inserts
    return res.status(201).json({
      status: true,
      message: "Data inserted into RepliedMessageModel and multiple RepliedMsgBodyModel records successfully",
      repliedMessage: newRepliedMessage,
      repliedMsgBodies: newRepliedMsgBodies,
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


exports.getAllReplyMessages = asyncHandler(async (req, res) => {
  const { page, limit, access_id } = req.query;

  try {
    // Handle multiple access_ids (split by commas and convert to integers)
    const accessIds = access_id ? access_id.split(',').map(id => parseInt(id, 10)) : [];

    // Build condition for filtering by access_id
    const whereClause = accessIds.length > 0 ? { entry_by: { [Op.in]: accessIds } } : {};

    // Check if pagination parameters are provided
    const isPagination = page && limit;
    let repliedMessages;
    let totalCount;

    if (isPagination) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Fetch total count with filter
      totalCount = await RepliedMessageModel.count({
        include: [
          {
            model: msgMasterModel,
            as: 'message',
            where: whereClause,
          },
        ],
      });

      // Fetch reply messages with pagination and filter
      repliedMessages = await RepliedMessageModel.findAll({
        include: [
          {
            model: msgMasterModel,
            as: 'message',
            where: whereClause,
          },
          {
            model: RepliedMsgBodyModel,
            as: 'replyBodies',
          },
          {
            model: sendedMsgModel,
            as: 'sendedMessage',
          },
        ],
        order: [['replied_msg_id', 'DESC']],
        limit: limitNum,
        offset: offset,
      });
    } else {
      // Fetch all reply messages with filter
      repliedMessages = await RepliedMessageModel.findAll({
        include: [
          {
            model: msgMasterModel,
            as: 'message',
            where: whereClause,
          },
          {
            model: RepliedMsgBodyModel,
            as: 'replyBodies',
          },
          {
            model: sendedMsgModel,
            as: 'sendedMessage',
          },
        ],
        order: [['replied_msg_id', 'DESC']],
      });

      totalCount = repliedMessages.length;
    }

    // Process messages and fetch school details
    const schoolDetails = await Promise.all(
      repliedMessages.map(async (msg) => {
        // Safely access `message.school_id`
        const schoolIds = msg.message?.school_id ? msg.message.school_id.split(',') : [];

        // Fetch school details if `schoolIds` exist
        const schools = schoolIds.length
          ? await schoolModel.findAll({
            where: {
              sch_id: {
                [Op.in]: schoolIds,
              },
            },
          })
          : [];

        return {
          ...msg.get(), // Spread Sequelize instance data
          schools,
        };
      })
    );

    // Return response
    return res.status(200).json({
      status: true,
      message: isPagination
        ? 'Paginated reply messages retrieved successfully'
        : 'All reply messages retrieved successfully',
      data: schoolDetails,
      pagination: isPagination
        ? {
          total: totalCount,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
        }
        : null,
    });
  } catch (error) {
    console.error('Error fetching reply messages:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
});


exports.getReplyByMsgAndSendedId = asyncHandler(async (req, res) => {
  const { msg_id, sended_msg_id } = req.query; // or req.params depending on route

  if (!msg_id || !sended_msg_id) {
    return res.status(400).json({
      status: false,
      message: "msg_id and sended_msg_id are required",
    });
  }

  try {
    const repliedMessage = await RepliedMessageModel.findOne({
      where: { sended_msg_id },
      include: [
        {
          model: msgMasterModel,
          as: "message",
          where: { msg_id }, // ✅ must match this msg_id too
        },
        {
          model: RepliedMsgBodyModel,
          as: "replyBodies",
        },
        {
          model: sendedMsgModel,
          as: "sendedMessage",
        },
      ],
    });

    if (!repliedMessage) {
      return res.status(404).json({
        status: false,
        message: "No reply found for this msg_id and sended_msg_id",
      });
    }

    // optional: attach school details
    const schoolIds = repliedMessage.message?.school_id
      ? repliedMessage.message.school_id.split(",")
      : [];

    const schools = schoolIds.length
      ? await schoolModel.findAll({
        where: { sch_id: { [Op.in]: schoolIds } },
      })
      : [];

    return res.status(200).json({
      status: true,
      message: "Reply retrieved successfully",
      data: {
        ...repliedMessage.get(),
        schools,
      },
    });
  } catch (error) {
    console.error("Error fetching reply by msg_id & sended_msg_id:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


exports.insertMsgData = asyncHandler(async (req, res) => {
  try {

    const {
      subject_text,
      show_upto,
      msg_priority,
      msg_chat_type,
      msg_sgroup_id,
      is_reply_type,
      is_reply_required_any,
      is_active,
      entry_by,
      school_id,
      five_mobile_number,
      message_body,
    } = req.body;

    const schoolIdsString = school_id.join(',');

    const newMasterMessage = await msgMasterModel.create({
      subject_text,
      msg_chat_type,
      five_mobile_number,
      show_upto,
      msg_priority,
      msg_sgroup_id,
      is_reply_type,
      is_reply_required_any,
      is_active,
      school_id: schoolIdsString,
      entry_by,
    });

    const newm_msg_id = newMasterMessage?.msg_id;

    const messageBodyArray = Array.isArray(message_body)
      ? message_body
      : [message_body];


    for (let i = 0; i < messageBodyArray.length; i++) {
      const { msg_type, data_text, is_reply_required, order_number } =
        messageBodyArray[i];


      await msgBodyModel.create({
        msg_id: newm_msg_id,
        msg_type,
        data_text,
        is_reply_required,
        ordersno: order_number,
      });
    }

    res.status(200).json({
      status: "success",
      data: newMasterMessage,
    });
  } catch (error) {
    console.error("Error fetching msgBody with msgBody:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


// Edit message API


exports.updateMsgData = asyncHandler(async (req, res) => {
  try {
    const {
      msg_id,
      subject_text,
      show_upto,
      msg_priority,
      msg_chat_type,
      msg_sgroup_id,
      is_reply_type,
      is_reply_required_any,
      is_active,
      entry_by,
      edit_by,
      school_id,
      five_mobile_number,
      message_body,
      createdAt
    } = req.body;

    if (!msg_id) {
      return res.status(400).json({ status: "error", message: "Message ID required." });
    }

    const schoolIdsString = school_id.join(',');

    // Update master message
    await msgMasterModel.update(
      {
        subject_text,
        msg_chat_type,
        five_mobile_number,
        show_upto,
        msg_priority,
        msg_sgroup_id,
        is_reply_type,
        is_reply_required_any,
        is_active,
        school_id: schoolIdsString,
        entry_by,
        edit_by,
        createdAt
      },
      { where: { msg_id } }
    );



    // Update or insert message_body
    if (message_body && Array.isArray(message_body)) {
      // Fetch existing ids for this message
      const existingBodies = await msgBodyModel.findAll({ where: { msg_id } });
      // const existingIds = existingBodies.map(b => Number(b.msg_body_id)); // force number

      // After fetching existingBodies
      const existingIds = existingBodies.map(b => Number(b.msg_body_id)); // IDs already in DB
      const incomingIds = message_body
        .filter(b => b.msg_body_id)
        .map(b => Number(b.msg_body_id)); // IDs coming from frontend

      // Delete any message bodies that are in DB but not in the incoming request
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        await msgBodyModel.destroy({
          where: {
            msg_body_id: idsToDelete,
            msg_id
          }
        });
        console.log(`Deleted message bodies: ${idsToDelete.join(", ")}`);
      }


      for (const body of message_body) {
        const { msg_body_id, msg_type, data_text, is_reply_required, order_number } = body;

        if (msg_body_id && existingIds.includes(Number(msg_body_id))) {
          // ✅ Update existing
          const [updated] = await msgBodyModel.update(
            {
              msg_type,
              data_text: typeof data_text === "object" ? JSON.stringify(data_text) : data_text,
              is_reply_required,
              ordersno: order_number,
            },
            { where: { msg_body_id: Number(msg_body_id), msg_id } }
          );

          console.log(`Updated msg_body_id ${msg_body_id}:`, updated);
        } else {
          // ✅ Insert new
          await msgBodyModel.create({
            msg_id,
            msg_type,
            data_text: typeof data_text === "object" ? JSON.stringify(data_text) : data_text,
            is_reply_required,
            ordersno: order_number,
          });

          console.log(`Inserted new message body for msg_id ${msg_id}`);
        }
      }
    }



    res.status(200).json({ status: "success", message: "Message updated successfully." });
  } catch (error) {
    console.error("Error updating message data:", error);
    res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
});


exports.deleteMsgData = asyncHandler(async (req, res) => {
  const { msg_id } = req.params;

  // Find the message by its primary key
  const message = await msgMasterModel.findByPk(msg_id);

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Delete associated message bodies first
  await msgBodyModel.destroy({
    where: { msg_id },
  });

  // Delete the message itself
  await message.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Message and associated data deleted successfully',
  });
});

exports.getMessageDetailById = asyncHandler(async (req, res) => {
  try {
    const { msg_id } = req.params;

    // Fetch the message details by msg_id with the correct alias
    const messageDetail = await msgMasterModel.findOne({
      where: { msg_id },
      include: [
        {
          model: msgBodyModel,
          as: 'msg_bodies', // Corrected alias based on the error message
          required: true,
        },
        {
          model: studentMainDetailModel,
          as: 'student',
        },
        {
          model: sendedMsgModel,
          as: 'sendedMsg',
        },
      ],
    });

    // Check if message detail exists
    if (!messageDetail) {
      return res.status(404).json({
        status: false,
        message: "Message not found",
      });
    }

    // If found, send the message detail
    res.status(200).json({
      status: true,
      data: messageDetail,
    });
  } catch (error) {
    console.error("Error fetching message details:", error.stack);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


exports.getSingleMsgDetailById = asyncHandler(async (req, res) => {
  try {
    const { msg_id } = req.params; // Extract msg_id from the request parameters

    // Fetch the single msgMaster record by msg_id
    // const msgMaster = await msgMasterModel.findOne({
    //   where: { msg_id }, // Filter by the provided msg_id
    //   include: [
    //     {
    //       model: subGroupModel, // Include subGroupModel to get msg_sgroup_mst
    //       include: [
    //         {
    //           model: groupModel, // Include groupModel within subGroupModel
    //         },
    //       ],
    //     },
    //     {
    //       model: msgBodyModel, // Include msgBodyModel to fetch data from msg_body
    //       order: [["ordersno", "ASC"]], // Order msgBodyModel by ordersno
    //     },
    //   ],
    // });

    const msgMaster = await msgMasterModel.findOne({
      where: { msg_id },
      include: [
        {
          model: subGroupModel,
          include: [{ model: groupModel }],
        },
        {
          model: msgBodyModel,
        },
      ],
      order: [[msgBodyModel, "ordersno", "ASC"]], // ✅ correct way
    });

    // Check if data exists
    if (!msgMaster) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    // Prepare an array of school IDs for querying
    const schoolIds = msgMaster.school_id
      ? msgMaster.school_id.split(',').map(Number)
      : [];

    // Fetch all matching school records for the extracted IDs
    const schools = await schoolModel.findAll({
      where: {
        sch_id: {
          [Op.in]: schoolIds, // Use Op.in to match multiple IDs
        },
      },
    });

    // Create a mapping of school IDs to their full data
    const schoolMapping = schools.reduce((acc, school) => {
      acc[school.sch_id] = school; // Store the entire school object
      return acc;
    }, {});

    // Add full school data to the msgMaster record
    const msgMasterWithSchoolData = {
      ...msgMaster.toJSON(), // Convert Sequelize instance to plain object
      schools: schoolIds.map(id => schoolMapping[id]).filter(Boolean), // Get the full school data based on IDs
    };

    res.status(200).json({
      status: "success",
      data: msgMasterWithSchoolData,
    });
  } catch (error) {
    console.error("Error fetching single message:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


//====================  100 % Working Code start =================


exports.getInboxMsgDetails = asyncHandler(async (req, res) => {
  try {
    const { mobile } = req.params;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Reset to midnight

    const showBeforeDate = new Date(todayStart);
    showBeforeDate.setDate(showBeforeDate.getDate() + 1); // Move to the next day

    const mobileNumber = mobile.trim();


    const relatedProfiles = await studentMainDetailModel.findAll({
      where: {
        student_family_mobile_number: {
          [Op.like]: `%${mobileNumber}%`,
        },
      },
    });

    let scholarNumbers = [];
    relatedProfiles.forEach(profile => {
      if (profile.tab_active_status === 1) {
        scholarNumbers.push(profile.student_number);
      }
    });

    const msgSendedMaster = await sendedMsgModel.findAll({
      limit: 100,
      order: [['sended_msg_id', 'DESC']],
      where: { mobile_no: mobile },
      include: [
        {
          model: msgMasterModel,
          as: "msg_mst",
          required: false, // allow messages without matching msg_mst
          include: [
            {
              model: subGroupModel,
              as: "subgroup",
              include: [
                { model: groupModel, as: "group" }
              ]
            }
          ]
        },
        { model: studentMainDetailModel, as: 'student' }
      ]
    });

    const filteredData = scholarNumbers.length > 0
      ? msgSendedMaster.filter(msg => scholarNumbers.includes(Number(msg.scholar_no)))
      : msgSendedMaster;

    // Parse five_mobile_number if present
    filteredData.forEach(msg => {
      if (msg.msg_mst && msg.msg_mst.five_mobile_number) {
        try {
          msg.msg_mst.five_mobile_number = JSON.parse(msg.msg_mst.five_mobile_number);
        } catch (error) {
          console.error('Error parsing five_mobile_number:', error);
        }
      }
    });

    const finalData = msgSendedMaster.filter(msg => {
      const msgMst = msg.msg_mst;

      // Always include is_seen = 0
      if (msg.is_seen === 0) return true;

      // Include is_seen = 1 only if msgMst exists and conditions are met
      if (
        msg.is_seen === 1 &&
        msgMst &&
        msgMst.show_upto > showBeforeDate &&
        msgMst.msg_priority >= 1 &&
        msgMst.msg_priority < 4
      ) {
        return true;
      }

      return false;
    });


    // -----------------------
    // New grouping logic
    // -----------------------
    const groupedData = [];

    finalData.forEach(msg => {
      const msgMst = msg.msg_mst;       // sendedMsgModel -> msgMasterModel
      const subGroup = msgMst?.subgroup; // subgroup alias
      const group = subGroup?.group;     // group alias

      if (!msgMst) return;

      const groupId = group?.msg_group_id || 0;
      const groupName = group?.msg_group_name || "Unknown Group";

      const subGroupId = subGroup?.msg_sgroup_id || 0;
      const subGroupName = subGroup?.msg_sgroup_name || "Unknown Subgroup";

      let groupObj = groupedData.find(g => g.msg_group_id === groupId);
      if (!groupObj) {
        groupObj = { msg_group_id: groupId, msg_group_name: groupName, subgroups: [] };
        groupedData.push(groupObj);
      }

      let subgroupObj = groupObj.subgroups.find(sg => sg.msg_sgroup_id === subGroupId);
      if (!subgroupObj) {
        subgroupObj = { msg_sgroup_id: subGroupId, msg_sgroup_name: subGroupName, messages: [] };
        groupObj.subgroups.push(subgroupObj);
      }

      subgroupObj.messages.push(msg);
    });



    // -----------------------
    // Return response
    // -----------------------
    if (relatedProfiles && relatedProfiles.length > 0 && finalData.length > 0) {
      res.status(200).json({
        status: true,
        test: 11,
        length: finalData.length,
        data: groupedData,
        scholarNumbers
      });
    } else {
      res.status(200).json({
        status: false,
        length: finalData.length,
        data: groupedData,
      });
    }

  } catch (error) {
    console.error("Error fetching msgMaster with msgMaster:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});



exports.getSeenMsgDetails = asyncHandler(async (req, res) => {
  try {
    const { mobile } = req.params;
    const mobileNumber = mobile.trim();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Reset to midnight

    const showBeforeDate = new Date(todayStart);
    showBeforeDate.setDate(showBeforeDate.getDate() + 1); // Move to the next day

    // Fetch related student profiles
    const relatedProfiles = await studentMainDetailModel.findAll({
      where: {
        student_family_mobile_number: { [Op.like]: `%${mobileNumber}%` }
      }
    });

    let scholarNumbers = [];
    relatedProfiles.forEach(profile => {
      if (profile.tab_active_status === 1) {
        scholarNumbers.push(profile.student_number);
      }
    });

    // Fetch sent messages
    const msgSendedMaster = await sendedMsgModel.findAll({
      limit: 100,
      order: [['sended_msg_id', 'DESC']],
      where: { mobile_no: mobile, is_seen: 1 },
      include: [
        {
          model: msgMasterModel,
          as: "msg_mst", // important: alias must match your code
          where: {
            show_upto: { [Op.gt]: showBeforeDate }
          },
          include: [
            {
              model: subGroupModel,
              as: "subgroup", // alias from associations
              include: [
                {
                  model: groupModel,
                  as: "group" // alias from associations
                }
              ]
            }
          ]
        },
        {
          model: studentMainDetailModel,
          as: 'student'
        }
      ]
    });

    // Filter messages by scholar numbers and priority
    const filteredData = msgSendedMaster.filter(msg => {
      const inScholarNumbers = scholarNumbers.length > 0 ? scholarNumbers.includes(Number(msg.scholar_no)) : true;
      const msgPriority = msg.msg_mst?.msg_priority;
      const isStarred = msg?.is_starred;
      return inScholarNumbers && msgPriority >= 6 && msgPriority <= 10 && isStarred === 0;
    });

    // Parse five_mobile_number field
    filteredData.forEach(msg => {
      if (msg.msg_mst?.five_mobile_number) {
        try {
          msg.msg_mst.five_mobile_number = JSON.parse(msg.msg_mst.five_mobile_number);
        } catch (error) {
          console.error('Error parsing five_mobile_number:', error);
        }
      }
    });

    // Group messages under their actual group and subgroup
    const groupedData = [];
    filteredData.forEach(msg => {
      const msgMst = msg.msg_mst;
      const subGroup = msgMst?.subgroup;
      const group = subGroup?.group;

      const groupId = group?.msg_group_id || 0;
      const groupName = group?.msg_group_name || "Unknown Group";

      const subGroupId = subGroup?.msg_sgroup_id || 0;
      const subGroupName = subGroup?.msg_sgroup_name || "Unknown Subgroup";

      let groupObj = groupedData.find(g => g.msg_group_id === groupId);
      if (!groupObj) {
        groupObj = { msg_group_id: groupId, msg_group_name: groupName, subgroups: [] };
        groupedData.push(groupObj);
      }

      let subgroupObj = groupObj.subgroups.find(sg => sg.msg_sgroup_id === subGroupId);
      if (!subgroupObj) {
        subgroupObj = { msg_sgroup_id: subGroupId, msg_sgroup_name: subGroupName, messages: [] };
        groupObj.subgroups.push(subgroupObj);
      }

      subgroupObj.messages.push(msg);
    });

    // Send response
    if (relatedProfiles && relatedProfiles.length > 0 && groupedData.length > 0) {
      res.status(200).json({
        status: true,
        length: groupedData.length,
        data: groupedData,
      });
    } else {
      res.status(200).json({
        status: false,
        length: 0,
        data: [],
      });
    }

  } catch (error) {
    console.error("Error fetching seen messages:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});



exports.getStaredMsgDetails = asyncHandler(async (req, res) => {
  try {
    const { mobile } = req.params;
    const mobileNumber = mobile.trim();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Reset to midnight

    const showBeforeDate = new Date(todayStart);
    showBeforeDate.setDate(showBeforeDate.getDate() + 1); // Move to the next day

    // Fetch related student profiles
    const relatedProfiles = await studentMainDetailModel.findAll({
      where: { student_family_mobile_number: { [Op.like]: `%${mobileNumber}%` } }
    });

    let scholarNumbers = [];
    relatedProfiles.forEach(profile => {
      if (profile.tab_active_status === 1) {
        scholarNumbers.push(profile.student_number);
      }
    });

    // Fetch sent messages
    const msgSendedMaster = await sendedMsgModel.findAll({
      limit: 100,
      order: [['sended_msg_id', 'DESC']],
      where: { mobile_no: mobile, is_seen: 1 },
      include: [
        {
          model: msgMasterModel,
          as: "msg_mst",
          where: { show_upto: { [Op.gt]: showBeforeDate } },
          include: [
            { model: subGroupModel, as: "subgroup", include: [{ model: groupModel, as: "group" }] }
          ]
        },
        { model: studentMainDetailModel, as: 'student' }
      ]
    });

    // Filter messages according to your rules
    const filteredData = msgSendedMaster.filter(msg => {
      const inScholarNumbers = scholarNumbers.length > 0 ? scholarNumbers.includes(Number(msg.scholar_no)) : true;
      const msgPriority = msg.msg_mst?.msg_priority;
      const isStarred = msg?.is_starred;

      if (msgPriority >= 4 && msgPriority <= 5) return inScholarNumbers;
      if (msgPriority >= 6 && msgPriority <= 10 && isStarred === 1) return inScholarNumbers;
      return false;
    });

    // Parse five_mobile_number
    filteredData.forEach(msg => {
      if (msg.msg_mst?.five_mobile_number) {
        try {
          msg.msg_mst.five_mobile_number = JSON.parse(msg.msg_mst.five_mobile_number);
        } catch (error) {
          console.error('Error parsing five_mobile_number:', error);
        }
      }
    });

    // Group messages by group/subgroup
    const groupedData = [];
    filteredData.forEach(msg => {
      const msgMst = msg.msg_mst;
      const subGroup = msgMst?.subgroup;
      const group = subGroup?.group;

      const groupId = group?.msg_group_id || 0;
      const groupName = group?.msg_group_name || "Unknown Group";

      const subGroupId = subGroup?.msg_sgroup_id || 0;
      const subGroupName = subGroup?.msg_sgroup_name || "Unknown Subgroup";

      let groupObj = groupedData.find(g => g.msg_group_id === groupId);
      if (!groupObj) {
        groupObj = { msg_group_id: groupId, msg_group_name: groupName, subgroups: [] };
        groupedData.push(groupObj);
      }

      let subgroupObj = groupObj.subgroups.find(sg => sg.msg_sgroup_id === subGroupId);
      if (!subgroupObj) {
        subgroupObj = { msg_sgroup_id: subGroupId, msg_sgroup_name: subGroupName, messages: [] };
        groupObj.subgroups.push(subgroupObj);
      }

      subgroupObj.messages.push(msg);
    });

    // Send response
    if (relatedProfiles && relatedProfiles.length > 0 && groupedData.length > 0) {
      res.status(200).json({
        status: true,
        length: groupedData.length,
        data: groupedData,
      });
    } else {
      res.status(200).json({
        status: false,
        length: 0,
        data: [],
      });
    }

  } catch (error) {
    console.error("Error fetching starred messages:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});



exports.getLastdayMsgDetails = asyncHandler(async (req, res) => {
  try {
    const { mobile } = req.params;

    // Get the current date and time
    const now = new Date();
    const today = new Date(); // Current date

    // Calculate the start of today (midnight)
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Calculate the start of yesterday (midnight)
    const startOfYesterday = new Date(now);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    // Calculate the end of yesterday (just before midnight)
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999); // Last millisecond of the day
    // Check any value tabed start ==========================
    // =============================================
    const mobileNumber = mobile.trim();

    // Use Sequelize's Op.like to check for the matching number in a comma-separated field
    const relatedProfiles = await studentMainDetailModel.findAll({
      where: {
        student_family_mobile_number: {
          [Op.like]: `%${mobileNumber}%`, // Find rows where mobile_no contains the number
        },
      },
    });

    let scholarNumbers = [];

    // Iterate over related profiles to check tab_active_status
    relatedProfiles.forEach(profile => {
      if (profile.tab_active_status === 1) {
        // If tab_active_status is 1, add the student_number to the list
        scholarNumbers.push(profile.student_number); // Adjust according to your model's field name
      }
    });
    // ===================================
    // Fetch sent messages for yesterday
    const msgSendedMaster = await sendedMsgModel.findAll({
      order: [['sended_msg_id', 'DESC']],
      where: {
        mobile_no: mobile,
      },
      include: [
        {
          model: msgMasterModel,
          as: "msg_mst",
          where: {
            show_upto: {
              [Op.gte]: startOfDay(today),
              [Op.lte]: endOfDay(today),
            },
          },
          include: [
            {
              model: subGroupModel,
              as: "subgroup",
              include: [{ model: groupModel, as: "group" }],
            },
          ],
        },
        {
          model: studentMainDetailModel,
          as: "student",
        },
      ],
    });


    // Filter by scholar numbers
    const filteredData = scholarNumbers.length > 0
      ? msgSendedMaster.filter(msg => scholarNumbers.includes(Number(msg.scholar_no)))
      : msgSendedMaster;

    // Parse five_mobile_number
    filteredData.forEach(msg => {
      if (msg.msg_mst?.five_mobile_number) {
        try {
          msg.msg_mst.five_mobile_number = JSON.parse(msg.msg_mst.five_mobile_number);
        } catch (error) {
          console.error('Error parsing five_mobile_number:', error);
        }
      }
    });

    // Group messages by group → subgroup
    const groupedData = [];
    filteredData.forEach(msg => {
      const msgMst = msg.msg_mst;
      const subGroup = msgMst?.subgroup;
      const group = subGroup?.group;

      const groupId = group?.msg_group_id || 0;
      const groupName = group?.msg_group_name || "Unknown Group";

      const subGroupId = subGroup?.msg_sgroup_id || 0;
      const subGroupName = subGroup?.msg_sgroup_name || "Unknown Subgroup";

      let groupObj = groupedData.find(g => g.msg_group_id === groupId);
      if (!groupObj) {
        groupObj = { msg_group_id: groupId, msg_group_name: groupName, subgroups: [] };
        groupedData.push(groupObj);
      }

      let subgroupObj = groupObj.subgroups.find(sg => sg.msg_sgroup_id === subGroupId);
      if (!subgroupObj) {
        subgroupObj = { msg_sgroup_id: subGroupId, msg_sgroup_name: subGroupName, messages: [] };
        groupObj.subgroups.push(subgroupObj);
      }

      subgroupObj.messages.push(msg);
    });

    // Send response
    if (relatedProfiles && relatedProfiles.length > 0 && groupedData.length > 0) {
      res.status(200).json({
        status: true,
        length: groupedData.length,
        data: groupedData,
      });
    } else {
      res.status(200).json({
        status: false,
        length: 0,
        data: [],
      });
    }

  } catch (error) {
    console.error("Error fetching last day messages:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});
