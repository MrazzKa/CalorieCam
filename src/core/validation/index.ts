export interface ValidationRule<T = any> {
  validate(value: T): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class RequiredRule implements ValidationRule<any> {
  validate(value: any): ValidationResult {
    const isValid = value !== null && value !== undefined && value !== '';
    return {
      isValid,
      errors: isValid ? [] : ['This field is required'],
    };
  }
}

export class MinLengthRule implements ValidationRule<string> {
  constructor(private minLength: number) {}
  
  validate(value: string): ValidationResult {
    const isValid = value.length >= this.minLength;
    return {
      isValid,
      errors: isValid ? [] : [`Minimum length is ${this.minLength} characters`],
    };
  }
}

export class MaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number) {}
  
  validate(value: string): ValidationResult {
    const isValid = value.length <= this.maxLength;
    return {
      isValid,
      errors: isValid ? [] : [`Maximum length is ${this.maxLength} characters`],
    };
  }
}

export class EmailRule implements ValidationRule<string> {
  validate(value: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    return {
      isValid,
      errors: isValid ? [] : ['Invalid email format'],
    };
  }
}

export class MinValueRule implements ValidationRule<number> {
  constructor(private minValue: number) {}
  
  validate(value: number): ValidationResult {
    const isValid = value >= this.minValue;
    return {
      isValid,
      errors: isValid ? [] : [`Minimum value is ${this.minValue}`],
    };
  }
}

export class MaxValueRule implements ValidationRule<number> {
  constructor(private maxValue: number) {}
  
  validate(value: number): ValidationResult {
    const isValid = value <= this.maxValue;
    return {
      isValid,
      errors: isValid ? [] : [`Maximum value is ${this.maxValue}`],
    };
  }
}

export class PatternRule implements ValidationRule<string> {
  constructor(private pattern: RegExp, private message: string) {}
  
  validate(value: string): ValidationResult {
    const isValid = this.pattern.test(value);
    return {
      isValid,
      errors: isValid ? [] : [this.message],
    };
  }
}

export class Validator<T = any> {
  private rules: ValidationRule<T>[] = [];

  addRule(rule: ValidationRule<T>): Validator<T> {
    this.rules.push(rule);
    return this;
  }

  validate(value: T): ValidationResult {
    const errors: string[] = [];
    
    for (const rule of this.rules) {
      const result = rule.validate(value);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const createValidator = <T = any>(): Validator<T> => {
  return new Validator<T>();
};
