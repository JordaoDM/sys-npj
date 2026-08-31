import React from "react";

export const validators = {
  required: (value, fieldName = "Campo") => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return `${fieldName} é obrigatório`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Email deve ter um formato válido";
    }
    return null;
  },

  minLength:
    (minLength) =>
    (value, fieldName = "Campo") => {
      if (!value) return null;
      if (value.length < minLength) {
        return `${fieldName} deve ter pelo menos ${minLength} caracteres`;
      }
      return null;
    },

  maxLength:
    (maxLength) =>
    (value, fieldName = "Campo") => {
      if (!value) return null;
      if (value.length > maxLength) {
        return `${fieldName} deve ter no máximo ${maxLength} caracteres`;
      }
      return null;
    },

  number: (value, fieldName = "Campo") => {
    if (!value) return null;
    if (isNaN(value)) {
      return `${fieldName} deve ser um número válido`;
    }
    return null;
  },

  positiveNumber: (value, fieldName = "Campo") => {
    if (!value) return null;
    const numberError = validators.number(value, fieldName);
    if (numberError) return numberError;
    if (parseFloat(value) <= 0) {
      return `${fieldName} deve ser um número positivo`;
    }
    return null;
  },

  dateNotPast: (value, fieldName = "Data") => {
    if (!value) return null;
    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      return `${fieldName} não pode ser no passado`;
    }
    return null;
  },

  cpf: (value) => {
    if (!value) return null;
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(value)) {
      return "CPF deve ter o formato XXX.XXX.XXX-XX";
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!phoneRegex.test(value)) {
      return "Telefone deve ter o formato (XX) XXXXX-XXXX";
    }
    return null;
  },
};

export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      const error = rule(value, fieldName);
      if (error) return error;
    }
    return null;
  };

  const validateAllFields = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (fieldName, value) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));

    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    const error = validateField(fieldName, values[fieldName]);
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const resetForm = (newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAllFields,
    resetForm,
    isValid: Object.keys(errors).length === 0,
  };
};

export const ValidatedInput = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  error,
  touched,
  onChange,
  onBlur,
  required = false,
  className = "",
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className={`
 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
 ${
   error && touched
     ? "border-red-500 focus:ring-red-200 bg-red-50"
     : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
 }
 `}
        {...props}
      />
      {error && touched && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <span></span> {error}
        </p>
      )}
    </div>
  );
};
