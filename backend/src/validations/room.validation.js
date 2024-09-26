const { body } = require("express-validator");

const createRoomValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề phòng là bắt buộc")
    .isLength({ max: 255 })
    .withMessage("Tiêu đề không được quá 255 ký tự"),
  body("description").trim().notEmpty().withMessage("Mô tả là bắt buộc"),
  body("price").isFloat({ min: 0 }).withMessage("Giá phải là số dương"),
  body("area")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Diện tích phải là số dương"),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("Thành phố là bắt buộc")
    .isLength({ max: 100 }),
  body("district")
    .trim()
    .notEmpty()
    .withMessage("Quận/huyện là bắt buộc")
    .isLength({ max: 100 }),
  body("street").optional().trim().isLength({ max: 255 }),
  // Boolean amenities
  body("wifi").optional().isBoolean(),
  body("parking").optional().isBoolean(),
  body("air_conditioner").optional().isBoolean(),
  body("private_bathroom").optional().isBoolean(),
  body("kitchen").optional().isBoolean(),
];

const updateRoomValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Tiêu đề không được quá 255 ký tự"),
  body("description").optional().trim(),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá phải là số dương"),
  body("area")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Diện tích phải là số dương"),
  body("city").optional().trim().isLength({ max: 100 }),
  body("district").optional().trim().isLength({ max: 100 }),
  body("street").optional().trim().isLength({ max: 255 }),
  // Boolean amenities
  body("wifi").optional().isBoolean(),
  body("parking").optional().isBoolean(),
  body("air_conditioner").optional().isBoolean(),
  body("private_bathroom").optional().isBoolean(),
  body("kitchen").optional().isBoolean(),
];

module.exports = {
  createRoomValidation,
  updateRoomValidation,
};
