const asyncHandler = require("express-async-handler");
const StudentModel = require("../models/studentModel");
const sendedMsgModel = require("../models/sendedMsgModel");

const Sequelize = require('sequelize');

const { ChatMessage, msgMasterModel, studentMainDetailModel } = require("../models/associations");

// Send a message
exports.sendMessage1 = asyncHandler(async (req, res) => {
  const { msg_id, link, sender_id, sender_detail, msg_type, chat_type, mobile_no, group_id, receiver_id, message } = req.body;
  //group is is main master msg id heeeeeeeeee
  try {
    const newMessage = await ChatMessage.create({
      sender_id,
      sender_detail,
      msg_id,
      mobile_no,
      chat_type,
      group_id: group_id || null,
      link: link || null,
      msg_type: msg_type || "TEXT",
      receiver_id: receiver_id || null,
      message,
    });

    res.status(201).json({
      status: true,
      message: "Message_Sent_Successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred while sending the message",
      error: error.message,
    });
  }
});

exports.sendMessage_individual_chat = async (req, res) => {
  const { msg_id, sender_id, sender_detail, link, msg_type, chat_type, mobile_no, group_id, message, receiverMobileNumbers } = req.body;

  try {
    // Check if the receiver mobile numbers are valid
    const validReceivers = await StudentModel.findAll({
      where: {
        student_family_mobile_number: receiverMobileNumbers.map(num => num.mobilenumber),
      },
    });

    if (validReceivers.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid receivers found.' });
    }

    // Step 2: Create a single ChatMessage entry
    const savedMessage = await ChatMessage.create({
      msg_id,
      msg_type, link,
      sender_id,
      sender_detail,
      chat_type,
      mobile_no,
      group_id,
      message,
      receiver_id: JSON.stringify(receiverMobileNumbers) // Store as a JSON string if needed
    });
    res.status(201).json({
      status: true,
      data: {
        messages: savedMessage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Failed to send message.' });
  }
};

exports.getMessages_individual_chatss = async (req, res) => {
  const { student_main_id, msg_id } = req.query;

  try {
    const singleMessage = await msgMasterModel.findOne({
      where: { msg_id },
      attributes: ["msg_id", "five_mobile_number"],
    });

    // Retrieve the message details
    const msgMaster = await msgMasterModel.findOne({
      where: { msg_id },
    });

    let studentDetails = [];
    let studentDetailstwo = [];
    let detailedGroupMembers = [];

    if (msgMaster?.five_mobile_number) {
      const fiveMobileNumbers = JSON.parse(msgMaster.five_mobile_number);
      const studentMainIds = fiveMobileNumbers.map((item) => item.student_main_id);

      // Fetch student details based on student_main_ids
      studentDetails = await studentMainDetailModel.findAll({
        where: {
          student_main_id: studentMainIds,
        },
        attributes: [
          "student_main_id",
          "student_name",
          "student_number",
          "student_family_mobile_number",
        ], // Add desired fields
        raw: true,
      });

      studentDetailstwo = await studentMainDetailModel.findAll({
        attributes: [
          "student_main_id",
          "student_name",
          "student_number",
          "student_family_mobile_number",
        ], // Add desired fields
        raw: true,
      });

      // Process the student_family_mobile_number to select only one number if there are two
      studentDetails = studentDetails.map((student) => {
        let mobileNumber = student.student_family_mobile_number;

        // Handle multiple numbers in the family mobile number field
        if (mobileNumber && (mobileNumber.includes(",") || mobileNumber.includes(" "))) {
          mobileNumber = mobileNumber.split(/[,\s]+/)[0]; // Take the first number
        }

        return {
          ...student,
          student_family_mobile_number: mobileNumber,
        };
      });

      // Fetch group members
      const groupMember = await sendedMsgModel.findAll({
        where: {
          msg_id: msg_id,
        },
        attributes: ["mobile_no"], // Add desired fields
        raw: true,
      });

      // Match students by mobile_no and create a detailed list for group members
      detailedGroupMembers = groupMember.map((member) => {
        const studentDetail = studentDetailstwo.find((student) => {
          const normalizedStudentNumber = student.student_number
            ? String(student.student_number).trim()
            : null;
          const normalizedFamilyNumber = student.student_family_mobile_number
            ? String(student.student_family_mobile_number).trim()
            : null;
          const normalizedMemberMobile = member.mobile_no
            ? String(member.mobile_no).trim()
            : null;

          return (
            normalizedStudentNumber === normalizedMemberMobile ||
            (normalizedFamilyNumber &&
              normalizedFamilyNumber.includes(normalizedMemberMobile))
          );
        });

        return {
          mobile_no: member.mobile_no,
          student_name: studentDetail ? studentDetail.student_name : "Unknown",
          student_main_id: studentDetail ? studentDetail.student_main_id : null,
        };
      });

    }

    if (!singleMessage) {
      return res.status(404).json({ status: false, message: "Message not found" });
    }

    const fiveMobileNumbers = JSON.parse(singleMessage.five_mobile_number);
    const studentIds = fiveMobileNumbers.map((number) => Number(number.student_main_id));

    const hasMatch = studentIds.includes(Number(student_main_id));

    let message;
    if (hasMatch) {
      message = await ChatMessage.findAll({
        where: { msg_id, chat_type: "INDIVIDUALCHAT" },
        include: [
          {
            model: msgMasterModel,
            as: "messageDetails",
            attributes: ["msg_id", "five_mobile_number", "msg_chat_type"],
          },
          {
            model: studentMainDetailModel,
            as: "senderDetails",
            attributes: ["student_main_id", "student_name", "student_number", "color"],
            where: {
              student_main_id: Sequelize.col("senderDetails.student_main_id"),
            },
          },
        ],
        order: [["sent_at", "ASC"]],
      });

      message = message.map((msg) => {
        msg.messageDetails.five_mobile_number = JSON.parse(
          msg.messageDetails.five_mobile_number
        );
        return msg;
      });

      return res.json({
        status: true,
        messages: message,
        length: message.length,
        studentIds,
        five_numbers_Details: studentDetails,
        groupMember: detailedGroupMembers,
      });
    } else {
      const all_mix_ids = [];
      all_mix_ids.push(...studentIds);
      const stdno = parseInt(student_main_id);
      all_mix_ids.push(stdno);

      message = await ChatMessage.findAll({
        where: { msg_id, chat_type: "INDIVIDUALCHAT" },
        include: [
          {
            model: msgMasterModel,
            as: "messageDetails",
            attributes: ["msg_id", "five_mobile_number", "msg_chat_type"],
          },
          {
            model: studentMainDetailModel,
            as: "senderDetails",
            attributes: ["student_main_id", "student_name", "student_number"],
            where: {
              student_main_id: Sequelize.col("senderDetails.student_main_id"),
            },
          },
        ],
        order: [["sent_at", "ASC"]],
      });

      const filteredMessages = message.filter((msg) => {
        const isMatch = all_mix_ids.includes(Number(msg.sender_id));
        return isMatch;
      });

      filteredMessages.forEach((msg) => {
        msg.messageDetails.five_mobile_number = JSON.parse(
          msg.messageDetails.five_mobile_number
        );
      });

      if (filteredMessages.length === 0) {
        return res.status(404).json({
          status: true,
          messages: filteredMessages,
          length: filteredMessages.length,
          studentIds,
          five_numbers_Details: studentDetails,
          groupMember: detailedGroupMembers,
        });
      } else {
        return res.json({
          status: true,
          messages: filteredMessages,
          length: filteredMessages.length,
          studentIds,
          five_numbers_Details: studentDetails,
          groupMember: detailedGroupMembers,
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Failed to retrieve messages." });
  }
};



// Retrieve messages for a specific group
exports.getChatGroupMessagesByGroupId = asyncHandler(async (req, res) => {
  const { groupId } = req.query;
  const msg_id = groupId;

  try {

    const msgMaster = await msgMasterModel.findOne({
      where: { msg_id: msg_id },
    });



    let studentDetails = [];
    if (msgMaster.five_mobile_number) {
      const fiveMobileNumbers = JSON.parse(msgMaster.five_mobile_number);
      const studentMainIds = fiveMobileNumbers.map((item) => item.student_main_id);

      // Fetch student details based on student_main_ids from student_main_detailModel
      studentDetails = await studentMainDetailModel.findAll({
        where: {
          student_number: studentMainIds,
        },
        attributes: ['student_main_id', 'student_name', 'student_number', 'student_family_mobile_number'], // Add desired fields
        raw: true, // To get raw data for processing
      });

      // Process the student_family_mobile_number to select only one number if there are two
      studentDetails = studentDetails.map((student) => {
        let mobileNumber = student.student_family_mobile_number;

        // Check if the mobile number contains two numbers (comma or space separated)
        if (mobileNumber && (mobileNumber.includes(',') || mobileNumber.includes(' '))) {
          // Split by comma or space and take only the first number
          mobileNumber = mobileNumber.split(/[,\s]+/)[0]; // Handle both commas and spaces
        }

        return {
          ...student,
          student_family_mobile_number: mobileNumber, // Replace with first number
        };
      });
    }




    const messages = await ChatMessage.findAll({
      where: { group_id: groupId, chat_type: "GROUPCHAT" },
      order: [['sent_at', 'ASC']],
      include: [
        {
          model: StudentModel,
          as: 'senderDetails', // ✅ matches associations.js
          attributes: ['student_name', 'student_number', 'color'],
        },
        {
          model: StudentModel,
          as: 'receiverDetails', // ✅ matches associations.js
          attributes: ['student_name', 'student_number', 'color'],
        },
      ],
    });


    if (messages.length > 0) {
      res.status(200).json({
        status: true,
        message: "Messages_Found",
        data: messages, five_numbers_Details: studentDetails,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No_Messages_Found",
        data: [], five_numbers_Details: studentDetails,
      });
    }
  } catch (error) {
    console.error("Error retrieving messages:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred while retrieving messages",
      error: error.message,
    });
  }
});

// exports.getMessages_individual_chat = async (req, res) => {
//   const { student_main_id, msg_id } = req.query;

//   try {
//     const singleMessage = await msgMasterModel.findOne({
//       where: { msg_id },
//       attributes: ["msg_id", "five_mobile_number"],
//     });

//     // Retrieve the message details
//     const msgMaster = await msgMasterModel.findOne({
//       where: { msg_id },
//     });

//     let studentDetails = [];
//     let studentDetailstwo = [];
//     let detailedGroupMembers = [];

//     if (msgMaster?.five_mobile_number) {
//       const fiveMobileNumbers = JSON.parse(msgMaster.five_mobile_number);
//       const studentMainIds = fiveMobileNumbers.map((item) => item.student_main_id);

//       // Fetch student details based on student_main_ids
//       studentDetails = await studentMainDetailModel.findAll({
//         where: {
//           student_main_id: studentMainIds,
//         },
//         attributes: [
//           "student_main_id",
//           "student_name",
//           "student_number",
//           "student_family_mobile_number",
//         ], // Add desired fields
//         raw: true,
//       });

//       studentDetailstwo = await studentMainDetailModel.findAll({
//         where: {
//           is_active: 1,
//         },
//         attributes: [
//           "student_main_id",
//           "student_name",
//           "student_number",
//           "student_family_mobile_number",
//         ], // Add desired fields
//         raw: true,
//       });

//       // Process the student_family_mobile_number to select only one number if there are two
//       studentDetails = studentDetails.map((student) => {
//         let mobileNumber = student.student_family_mobile_number;

//         // Handle multiple numbers in the family mobile number field
//         if (mobileNumber && (mobileNumber.includes(",") || mobileNumber.includes(" "))) {
//           mobileNumber = mobileNumber.split(/[,\s]+/)[0]; // Take the first number
//         }

//         return {
//           ...student,
//           student_family_mobile_number: mobileNumber,
//         };
//       });

//       // Fetch group members
//       const groupMember = await sendedMsgModel.findAll({
//         where: {
//           msg_id: msg_id,
//         },
//         attributes: ["mobile_no"], // Add desired fields
//         raw: true,
//       });

//       // Match students by mobile_no and create a detailed list for group members new
//       // detailedGroupMembers = groupMember.flatMap((member) => {
//       //   const normalizedMemberMobile = member.mobile_no ? String(member.mobile_no).trim() : null;

//       //   const matchedStudents = studentDetailstwo.filter((student) => {
//       //     const normalizedStudentNumber = student.student_number ? String(student.student_number).trim() : null;
//       //     const normalizedFamilyNumber = student.student_family_mobile_number ? String(student.student_family_mobile_number).trim() : null;

//       //     return (
//       //       normalizedStudentNumber === normalizedMemberMobile ||
//       //       (normalizedFamilyNumber && normalizedFamilyNumber.includes(normalizedMemberMobile))
//       //     );
//       //   });

//       //   if (matchedStudents.length === 0) {
//       //     return [
//       //       {
//       //         mobile_no: member.mobile_no,
//       //         student_name: "Unknown",
//       //         student_main_id: null,
//       //       },
//       //     ];
//       //   }

//       //   return matchedStudents.map((student) => ({
//       //     mobile_no: member.mobile_no,
//       //     student_name: student.student_name,
//       //     student_main_id: student.student_main_id,
//       //   }));
//       // });

//       // Match students by mobile_no and create a detailed list for group members
//       detailedGroupMembers = groupMember.flatMap((member) => {
//         const normalizedMemberMobile = member.mobile_no ? String(member.mobile_no).trim() : null;

//         const matchedStudents = studentDetailstwo.filter((student) => {
//           const normalizedStudentNumber = student.student_number ? String(student.student_number).trim() : null;
//           const normalizedFamilyNumber = student.student_family_mobile_number ? String(student.student_family_mobile_number).trim() : null;

//           return (
//             normalizedStudentNumber === normalizedMemberMobile ||
//             (normalizedFamilyNumber && normalizedFamilyNumber.includes(normalizedMemberMobile))
//           );
//         });

//         // ❌ remove Unknown entry → just skip if no matches
//         if (matchedStudents.length === 0) {
//           return []; // nothing added
//         }

//         return matchedStudents.map((student) => ({
//           mobile_no: member.mobile_no,
//           student_name: student.student_name,
//           student_main_id: student.student_main_id,
//         }));
//       });


//       // ✅ Remove duplicates (same mobile_no + student_main_id)
//       detailedGroupMembers = Array.from(
//         new Map(
//           detailedGroupMembers.map((item) => [
//             `${item.mobile_no}-${item.student_main_id}`,
//             item,
//           ])
//         ).values()
//       );
//       // Match students by mobile_no and create a detailed list for group members new
//     }

//     if (!singleMessage) {
//       return res.status(404).json({ status: false, message: "Message not found" });
//     }

//     const fiveMobileNumbers = JSON.parse(singleMessage.five_mobile_number);
//     const studentIds = fiveMobileNumbers.map((number) => Number(number.student_main_id));

//     const hasMatch = studentIds.includes(Number(student_main_id));

//     let message;
//     if (hasMatch) {
//       message = await ChatMessage.findAll({
//         where: { msg_id, chat_type: "INDIVIDUALCHAT" },
//         include: [
//           {
//             model: msgMasterModel,
//             as: "messageDetails",
//             attributes: ["msg_id", "five_mobile_number", "msg_chat_type"],
//           },
//           {
//             model: studentMainDetailModel,
//             as: "senderDetails",
//             attributes: ["student_main_id", "student_name", "student_number", "color"],
//             where: {
//               student_main_id: Sequelize.col("senderDetails.student_main_id"),
//             },
//           },
//         ],
//         order: [["sent_at", "ASC"]],
//       });

//       message = message.map((msg) => {
//         msg.messageDetails.five_mobile_number = JSON.parse(
//           msg.messageDetails.five_mobile_number
//         );
//         return msg;
//       });

//       return res.json({
//         status: true,
//         messages: message,
//         length: message.length,
//         studentIds,
//         five_numbers_Details: studentDetails,
//         groupMember: detailedGroupMembers,
//       });
//     } else {
//       const all_mix_ids = [];
//       all_mix_ids.push(...studentIds);
//       const stdno = parseInt(student_main_id);
//       all_mix_ids.push(stdno);

//       message = await ChatMessage.findAll({
//         where: { msg_id, chat_type: "INDIVIDUALCHAT" },
//         include: [
//           {
//             model: msgMasterModel,
//             as: "messageDetails",
//             attributes: ["msg_id", "five_mobile_number", "msg_chat_type"],
//           },
//           {
//             model: studentMainDetailModel,
//             as: "senderDetails",
//             attributes: ["student_main_id", "student_name", "student_number"],
//             where: {
//               student_main_id: Sequelize.col("senderDetails.student_main_id"),
//             },
//           },
//         ],
//         order: [["sent_at", "ASC"]],
//       });

//       const filteredMessages = message.filter((msg) => {
//         const msgSenderId = Number(msg.sender_id);
//         const studentId = Number(student_main_id);

//         // Allow messages where sender is involved OR the receiver is the current student
//         const isTeacherOrOwnMessage = all_mix_ids.includes(msgSenderId) || msgSenderId === studentId;

//         const isPrivateMessage =
//           msg.private_message === null ||
//           Number(msg.private_message) === studentId ||
//           msgSenderId === studentId;  // 👈 This line is the key change

//         return isTeacherOrOwnMessage && isPrivateMessage;
//       });

//       filteredMessages.forEach((msg) => {
//         msg.messageDetails.five_mobile_number = JSON.parse(
//           msg.messageDetails.five_mobile_number
//         );
//       });

//       // ✅ Check if current user is a teacher
//       const isTeacher = studentDetails.some(
//         (s) => Number(s.student_main_id) === Number(student_main_id)
//       );

//       if (filteredMessages.length === 0) {
//         return res.status(200).json({
//           status: true,
//           messages: filteredMessages,
//           length: filteredMessages.length,
//           studentIds,
//           five_numbers_Details: studentDetails,
//           groupMember: isTeacher ? detailedGroupMembers : [],  // 👈 only show if teacher
//         });
//       } else {
//         return res.json({
//           status: true,
//           messages: filteredMessages,
//           length: filteredMessages.length,
//           studentIds,
//           five_numbers_Details: studentDetails,
//           groupMember: isTeacher ? detailedGroupMembers : [],  // 👈 only show if teacher
//         });
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Failed to retrieve messages." });
//   }
// };


exports.getMessages_individual_chat = async (req, res) => {
  const { student_main_id, msg_id } = req.query;

  try {
    const singleMessage = await msgMasterModel.findOne({
      where: { msg_id },
      attributes: ["msg_id", "five_mobile_number"],
    });

    // Retrieve the message details
    const msgMaster = await msgMasterModel.findOne({
      where: { msg_id },
    });

    let studentDetails = [];
    let studentDetailstwo = [];
    let detailedGroupMembers = [];

    if (msgMaster?.five_mobile_number) {
      const fiveMobileNumbers = JSON.parse(msgMaster.five_mobile_number);
      const studentMainIds = fiveMobileNumbers.map((item) => item.student_main_id);

      // Fetch student details based on student_main_ids
      studentDetails = await studentMainDetailModel.findAll({
        where: {
          student_number: studentMainIds,
        },
        attributes: [
          "student_main_id",
          "student_name",
          "student_number",
          "student_family_mobile_number",
        ], // Add desired fields
        raw: true,
      });

      studentDetailstwo = await studentMainDetailModel.findAll({
        where: {
          is_active: 1,
        },
        attributes: [
          "student_main_id",
          "student_name",
          "student_number",
          "student_family_mobile_number",
        ], // Add desired fields
        raw: true,
      });

      // Process the student_family_mobile_number to select only one number if there are two
      studentDetails = studentDetails.map((student) => {
        let mobileNumber = student.student_family_mobile_number;

        // Handle multiple numbers in the family mobile number field
        if (mobileNumber && (mobileNumber.includes(",") || mobileNumber.includes(" "))) {
          mobileNumber = mobileNumber.split(/[,\s]+/)[0]; // Take the first number
        }

        return {
          ...student,
          student_family_mobile_number: mobileNumber,
        };
      });

      // Fetch group members
      const groupMember = await sendedMsgModel.findAll({
        where: {
          msg_id: msg_id,
        },
        attributes: ["mobile_no"], // Add desired fields
        raw: true,
      });

      // Match students by mobile_no and create a detailed list for group members new
      detailedGroupMembers = groupMember.flatMap((member) => {
        const normalizedMemberMobile = member.mobile_no ? String(member.mobile_no).trim() : null;

        const matchedStudents = studentDetailstwo.filter((student) => {
          const normalizedStudentNumber = student.student_number ? String(student.student_number).trim() : null;
          const normalizedFamilyNumber = student.student_family_mobile_number ? String(student.student_family_mobile_number).trim() : null;

          return (
            normalizedStudentNumber === normalizedMemberMobile ||
            (normalizedFamilyNumber && normalizedFamilyNumber.includes(normalizedMemberMobile))
          );
        });

        if (matchedStudents.length === 0) {
          return [
            {
              mobile_no: member.mobile_no,
              student_name: "Unknown",
              student_main_id: null,
              student_number: null,
            },
          ];
        }

        return matchedStudents.map((student) => ({
          mobile_no: member.mobile_no,
          student_name: student.student_name,
          student_main_id: student.student_main_id,
          student_number: student.student_number,
        }));
      });

      // ✅ Remove duplicates (same mobile_no + student_main_id)
      detailedGroupMembers = Array.from(
        new Map(
          detailedGroupMembers.map((item) => [
            `${item.mobile_no}-${item.student_main_id}`,
            item,
          ])
        ).values()
      );
      // Match students by mobile_no and create a detailed list for group members new
    }

    if (!singleMessage) {
      return res.status(404).json({ status: false, message: "Message not found" });
    }

    const fiveMobileNumbers = JSON.parse(singleMessage.five_mobile_number);
    const studentIds = fiveMobileNumbers.map((number) => Number(number.student_main_id));

    const hasMatch = studentIds.includes(Number(student_main_id));

    let message;
    if (hasMatch) {
      message = await ChatMessage.findAll({
        where: { msg_id, chat_type: "INDIVIDUALCHAT" },
        include: [
          {
            model: msgMasterModel,
            as: "messageDetails",
            attributes: ["msg_id", "five_mobile_number", "msg_chat_type"],
          },
          {
            model: studentMainDetailModel,
            as: "senderDetails",
            attributes: ["student_main_id", "student_name", "student_number", "color"],
            where: {
              student_number: Sequelize.col("senderDetails.student_number"),
            },
          },
        ],
        order: [["sent_at", "ASC"]],
      });

      message = message.map((msg) => {
        msg.messageDetails.five_mobile_number = JSON.parse(
          msg.messageDetails.five_mobile_number
        );
        return msg;
      });

      return res.json({
        status: true,
        messages: message,
        length: message.length,
        studentIds,
        five_numbers_Details: studentDetails,
        groupMember: detailedGroupMembers,
      });
    } else {
      const all_mix_ids = [];
      all_mix_ids.push(...studentIds);
      const stdno = parseInt(student_main_id);
      all_mix_ids.push(stdno);

      message = await ChatMessage.findAll({
        where: { msg_id, chat_type: "INDIVIDUALCHAT" },
        include: [
          {
            model: msgMasterModel,
            as: "messageDetails",
            attributes: ["msg_id", "five_mobile_number", "msg_chat_type"],
          },
          {
            model: studentMainDetailModel,
            as: "senderDetails",
            attributes: ["student_main_id", "student_name", "student_number"],
            where: {
              student_number: Sequelize.col("senderDetails.student_number"),
            },
          },
        ],
        order: [["sent_at", "ASC"]],
      });

      const filteredMessages = message.filter((msg) => {
        const msgSenderId = Number(msg.sender_id);
        const studentId = Number(student_main_id);

        // Allow messages where sender is involved OR the receiver is the current student
        const isTeacherOrOwnMessage = all_mix_ids.includes(msgSenderId) || msgSenderId === studentId;

        const isPrivateMessage =
          msg.private_message === null ||
          Number(msg.private_message) === studentId ||
          msgSenderId === studentId;  // 👈 This line is the key change

        return isTeacherOrOwnMessage && isPrivateMessage;
      });

      filteredMessages.forEach((msg) => {
        msg.messageDetails.five_mobile_number = JSON.parse(
          msg.messageDetails.five_mobile_number
        );
      });

      // ✅ Check if current user is a teacher
      const isTeacher = studentDetails.some(
        (s) => Number(s.student_number) === Number(student_main_id)
      );

      if (filteredMessages.length === 0) {
        return res.status(200).json({
          status: true,
          messages: filteredMessages,
          length: filteredMessages.length,
          studentIds,
          five_numbers_Details: studentDetails,
          groupMember: isTeacher ? detailedGroupMembers : [],  // 👈 only show if teacher
        });
      } else {
        return res.json({
          status: true,
          messages: filteredMessages,
          length: filteredMessages.length,
          studentIds,
          five_numbers_Details: studentDetails,
          groupMember: isTeacher ? detailedGroupMembers : [],  // 👈 only show if teacher
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Failed to retrieve messages." });
  }
};