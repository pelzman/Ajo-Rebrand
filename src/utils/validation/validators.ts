import Joi from "joi";

export const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email({ minDomainSegments: 2 }),
  phone: Joi.string().required(),
  password: Joi.string().required(),
  confirm_password: Joi.string().required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const validateCreateTarget = Joi.object({
    name: Joi.string().required()
    .messages({
      'any.required': 'Please provide your name.'
    }),
    target: Joi.string().required()
    .messages({
      'any.required': 'Please provide target name.'
    }),
    target_amount: Joi.number().required()
    .messages({
      'any.required': 'Target amount is required'
    }),
    category: Joi.string().required().valid('Travel', 'Dream_Home', 'Dream_Car', 'Other', 'Rent','Gadgets')
    .messages({
      'any.required': 'Category of saving is not yet filled. Please input.'
    }),
    
    frequency: Joi.string().required().valid('Daily', 'Weekly', 'Monthly', 'Annually')
    .messages({
      'any.required': 'Frequency of saving is not yet filled. Please input.'
    }),
    startDate: Joi.string().required()
    .messages({
      'any.required': 'Input start date'
    }),
    endDate: Joi.string().required()
    .messages({
      'any.required': 'Input end date'
    }),
  });

