/**
 * 请求参数校验中间件工厂
 * 
 * 使用方式:
 *   const validate = require('../middleware/validate');
 *   router.post('/', validate({ name: { required: true, maxLength: 200 } }), handler);
 * 
 * 支持的校验规则:
 *   - required: 必填（空字符串视为未填）
 *   - type: 'number' 类型校验
 *   - maxLength: 最大长度
 *   - min: 数值最小值
 *   - max: 数值最大值
 *   - pattern: 正则表达式校验
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // 必填校验
      if (rules.required) {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`${field} 不能为空`);
          continue;
        }
      }

      // 跳过 undefined 值的后续校验
      if (value === undefined || value === null) continue;

      // 类型校验
      if (rules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} 必须是数字`);
          continue;
        }
        if (rules.min !== undefined && num < rules.min) {
          errors.push(`${field} 不能小于 ${rules.min}`);
        }
        if (rules.max !== undefined && num > rules.max) {
          errors.push(`${field} 不能大于 ${rules.max}`);
        }
      }

      // 最大长度校验
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} 不能超过 ${rules.maxLength} 个字符`);
      }

      // 正则校验
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(rules.message || `${field} 格式不正确`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('; ') });
    }

    next();
  };
}

module.exports = validate;
