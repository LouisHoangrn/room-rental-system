const { body } = require("express-validator");

const registerValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Vui lòng nhập email hợp lệ")
    .normalizeEmail({ gmail_remove_dots: false }),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .matches(/\d/)
    .withMessage("Mật khẩu phải chứa ít nhất 1 chữ số"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên là bắt buộc")
    .isLength({ max: 100 })
    .withMessage("Tên không được quá 100 ký tự"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]*$/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("role")
    .optional()
    .isIn(["USER", "OWNER"])
    .withMessage("Vai trò phải là USER hoặc OWNER"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Vui lòng nhập email hợp lệ")
    .normalizeEmail({ gmail_remove_dots: false }),
  body("password").notEmpty().withMessage("Mật khẩu là bắt buộc"),
];

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Tên không được quá 100 ký tự"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]*$/)
    .withMessage("Số điện thoại không hợp lệ"),
];

const changePasswordValidation = [
  body("oldPassword").notEmpty().withMessage("Vui lòng nhập mật khẩu cũ"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
    .matches(/\d/)
    .withMessage("Mật khẩu mới phải chứa ít nhất 1 chữ số"),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
};
