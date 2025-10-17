const asyncHandler = require("express-async-handler");
const supportModel = require("../models/suppoprtModel");
const parentModel = require("../models/parentModel");
const studentMainModel = require("../models/studentModel");



// Get all support entries
const getAllSupports = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Fetch supports with pagination
        const supports = await supportModel.findAll({
            order: [["id", "DESC"]],
            limit: limit,
            offset: offset,
        });

        if (supports.length > 0) {
            // Fetch parent details for each support using parent_id as mobile number
            const supportsWithParents = await Promise.all(
                supports.map(async (support) => {
                    const parent = await studentMainModel.findOne({
                        where: { student_family_mobile_number: support.parent_id },
                    });

                    return {
                        ...support.dataValues,
                        parent_id: parent?.student_number || null, // replace parent_id with student_number
                        send_by: parent?.student_name || null,
                        send_by_mobile: parent?.student_family_mobile_number || null,
                    };
                })
            );

            const totalCount = await supportModel.count();

            res.status(200).json({
                status: true,
                message: "Data_Found",
                data: supportsWithParents,
                totalCount: totalCount,
            });
        } else {
            res.status(200).json({
                status: false,
                message: "No_Data_Found",
                data: null,
                totalCount: 0,
            });
        }
    } catch (error) {
        console.error("Error fetching support details:", error.message);
        res.status(500).json({
            status: false,
            message: "An error occurred",
            error: error.message,
        });
    }
});





// Get a single support entry by ID
const getSupportById = asyncHandler(async (req, res) => {
    const support = await supportModel.findByPk(req.params.id);
    if (!support) {
        res.status(404);
        throw new Error("Support entry not found");
    }
    res.status(200).json(support);
});



// Add a new support entry
const addSupport = asyncHandler(async (req, res) => {
    const { parent_id, description, status, remark, added_date, added_user_id } = req.body;

    if (!parent_id || !description) {
        res.status(400);
        throw new Error("Please provide all required fields");
    }

    const support = await supportModel.create({ parent_id, description, status, remark, added_date, added_user_id });
    res.status(201).json(support);
});




// Update an existing support entry
const updateSupport = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { parent_id, description, status, remark, added_date, added_user_id, edited_date, edited_user_id } = req.body;

    const support = await supportModel.findByPk(id);
    if (!support) {
        res.status(404);
        throw new Error("Support entry not found");
    }

    support.parent_id = parent_id || support.parent_id;
    support.description = description || support.description;
    support.status = status || support.status;
    support.remark = remark || support.remark;
    support.added_date = added_date || support.added_date;
    support.added_user_id = added_user_id || support.added_user_id;
    support.edited_date = edited_date || support.edited_date;
    support.edited_user_id = edited_user_id || support.edited_user_id;

    await support.save();
    res.status(200).json(support);
});



// Delete a support entry
const deleteSupport = asyncHandler(async (req, res) => {
    const support = await supportModel.findByPk(req.params.id);
    if (!support) {
        res.status(404);
        throw new Error("Support entry not found");
    }

    await support.destroy();
    res.status(200).json({ message: "Support entry deleted successfully" });
});

module.exports = {
    getAllSupports,
    getSupportById,
    addSupport,
    updateSupport,
    deleteSupport,
};
