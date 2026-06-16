const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  // STRICT RULE: Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .message('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number')
    .required(),
  phone: Joi.string()
    .pattern(/^(\+91)?[6-9]\d{9}$/)
    .required()
    .messages({ "string.pattern.base": "Phone must be a valid 10-digit Indian mobile number starting with 6–9" }),
  activeRole: Joi.string().valid('donor', 'receiver', 'ngo').default('donor'),
  organizationName: Joi.string().when('activeRole', { is: 'ngo', then: Joi.required(), otherwise: Joi.optional() }),
  bloodGroup: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  refCode: Joi.string().allow('').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    // Return 400 Bad Request with the specific error message
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = { validateRegister, validateLogin };