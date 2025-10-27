'use client'

import React from 'react';
import LookupField from './LookupField';

interface CustomFieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_hidden: boolean;
  options?: string[];
  placeholder?: string;
  default_value?: string;
  sort_order: number;
  lookup_type?: 'organizations' | 'hiring-managers' | 'job-seekers' | 'jobs';
}

interface CustomFieldRendererProps {
  field: CustomFieldDefinition;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  className?: string;
}

export default function CustomFieldRenderer({ 
  field, 
  value, 
  onChange, 
  className = "w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500" 
}: CustomFieldRendererProps) {
  if (field.is_hidden) return null;

  function formatNumberWithCommas(value: string | number) {
  let num = Number(value);
  if (isNaN(num)) return "";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
  // Format salary values for display
  const formatSalaryValue = (val: any) => {
    if (field.field_name === "minSalary" || field.field_name === "maxSalary") {
      if (val && !isNaN(parseFloat(val))) {
        return parseFloat(val).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
      }
      return "";
    }
    return val || "";
  };

  // Phone number formatting function
  const formatPhoneNumber = (input: string) => {
    // Remove all non-numeric characters
    const cleaned = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.substring(0, 10);
    
    // Format as (000) 000-0000
    if (limited.length >= 6) {
      return `(${limited.substring(0, 3)}) ${limited.substring(3, 6)}-${limited.substring(6)}`;
    } else if (limited.length >= 3) {
      return `(${limited.substring(0, 3)}) ${limited.substring(3)}`;
    } else if (limited.length > 0) {
      return `(${limited}`;
    }
    return limited;
  };
  

  // Handle phone number input changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    onChange(field.field_name, formatted);
  };

  const fieldProps = {
    id: field.field_name,
    value: value || "",
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => onChange(field.field_name, e.target.value),
    className,
    placeholder: field.placeholder || "",
    required: field.is_required,
  };

  // Special props for salary fields (without onChange)
  const salaryFieldProps = {
    id: field.field_name,
    className,
    placeholder: field.placeholder || "",
    required: field.is_required,
  };

  switch (field.field_type) {
    case "textarea":
      return (
        <textarea
          {...fieldProps}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          rows={3}
        />
      );
    case "select":
      return (
        <select {...fieldProps}>
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <input
          type="checkbox"
          id={field.field_name}
          checked={value === "true" || value === true}
          onChange={(e) => onChange(field.field_name, e.target.checked)}
          className="h-4 w-4"
        />
      );
      case "number":
  // Check if this field is for job salaries
  if (field.field_name === "minSalary" || field.field_name === "maxSalary") {
    return (
      <input
        {...salaryFieldProps}
        type="text"  // Text so we can add "$" & commas
        value={formatSalaryValue(value)}
        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
          let inputValue = e.target.value.replace(/[^0-9.]/g, ""); // Remove non-numeric except decimal
          
          // Handle multiple decimal points
          const decimalCount = (inputValue.match(/\./g) || []).length;
          if (decimalCount > 1) {
            inputValue = inputValue.substring(0, inputValue.lastIndexOf('.'));
          }
          
          // Limit decimal places to 2
          if (inputValue.includes('.')) {
            const parts = inputValue.split('.');
            if (parts[1] && parts[1].length > 2) {
              inputValue = parts[0] + '.' + parts[1].substring(0, 2);
            }
          }
          
          let number = parseFloat(inputValue);
          
          if (!isNaN(number) && inputValue !== "") {
            // Format as $XX,XXX.XX
            const formatted = number.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });
            e.target.value = formatted;
            // Call onChange with the numeric value for storage
            onChange(field.field_name, number);
          } else if (inputValue === "") {
            e.target.value = "";
            onChange(field.field_name, "");
          }
        }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          // Ensure proper formatting on blur
          let inputValue = e.target.value.replace(/[^0-9.]/g, "");
          let number = parseFloat(inputValue);
          
          if (!isNaN(number) && inputValue !== "") {
            const formatted = number.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });
            e.target.value = formatted;
            onChange(field.field_name, number);
          }
        }}
        placeholder="$XX,XXX.XX"
      />
    );
  }

  // ⚠️ All other number fields behave normal (organization, etc.)
  return (
    <input 
      {...fieldProps} 
      type="number"
      min="2000"
      max="2100"
      maxLength={4}
      onInput={(e) => {
        const target = e.target as HTMLInputElement;
        if (target.value.length > 4) {
          target.value = target.value.slice(0, 4);
        }
      }}
    />
  );

    // case "number":
    //   return (
    //     <input 
    //       {...fieldProps} 
    //       type="number"
    //       min="2000"
    //       max="2100"
    //       maxLength={4}
    //       onInput={(e) => {
    //         const target = e.target as HTMLInputElement;
    //         if (target.value.length > 4) {
    //           target.value = target.value.slice(0, 4);
    //         }
    //       }}
    //     />
    //   );
    case "date":
      return <input {...fieldProps} type="date" />;
    case "email":
      return <input {...fieldProps} type="email" />;
    case "phone":
      return (
        <input 
          {...fieldProps}
          type="tel"
          onChange={handlePhoneChange}
          maxLength={14} // (000) 000-0000 = 14 characters
          title="Phone number will be automatically formatted as (000) 000-0000"
        />
      );
    case "url":
      return <input {...fieldProps} type="url" />;
    case "file":
      return (
        <div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onChange(field.field_name, e.target.files[0]);
              }
            }}
            className="w-full p-2 text-gray-700"
            required={field.is_required}
          />
          <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX, TXT</p>
        </div>
      );
    case "lookup":
      return (
        <LookupField
          value={value || ""}
          onChange={(val) => onChange(field.field_name, val)}
          lookupType={field.lookup_type || 'organizations'}
          placeholder={field.placeholder || "Select an option"}
          required={field.is_required}
          className={className}
        />
      );
      default:
        return (
          <div style={{ position: "relative", width: "100%" }}>
            <input
              {...fieldProps}
              type="text"
              onChange={(e) => {
                fieldProps.onChange(e); // normal functionality continue rahe
              }}
              style={{ paddingRight: "25px" }} // thoda space right pe icon ke liye
            />
      
            {/* Sirf Job Title field ke liye icon show kare */}
            {field.field_name === "jobTitle" && (
              value && value.trim() !== "" ? (
                <span
                  style={{
                    color: "green",
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  ✔
                </span>
              ) : (
                <span
                  style={{
                    color: "red",
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  *
                </span>
              )
            )}
          </div>
        );
      }
}

// Hook for managing custom fields
export function useCustomFields(entityType: string) {
  const [customFields, setCustomFields] = React.useState<CustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = React.useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchCustomFields = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/field-management/${entityType}`);
      const data = await response.json();

      if (response.ok) {
        const sortedFields = (data.customFields || []).sort(
          (a: CustomFieldDefinition, b: CustomFieldDefinition) =>
            a.sort_order - b.sort_order
        );
        setCustomFields(sortedFields);

        // Initialize custom field values
        const customFieldValues: Record<string, any> = {};
        sortedFields.forEach((field: CustomFieldDefinition) => {
          customFieldValues[field.field_name] = field.default_value || "";
        });
        setCustomFieldValues(customFieldValues);
      }
    } catch (err) {
      console.error("Error fetching custom fields:", err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  const handleCustomFieldChange = React.useCallback((fieldName: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  const validateCustomFields = React.useCallback(() => {
    for (const field of customFields) {
      if (field.is_required && !field.is_hidden) {
        const value = customFieldValues[field.field_name];
        if (!value || (typeof value === "string" && !value.trim())) {
          return {
            isValid: false,
            message: `${field.field_label} is required`
          };
        }
      }
    }
    return { isValid: true, message: "" };
  }, [customFields, customFieldValues]);

  const getCustomFieldsForSubmission = React.useCallback(() => {
    const customFieldsToSend: Record<string, any> = {};
    customFields.forEach((field) => {
      if (!field.is_hidden) {
        customFieldsToSend[field.field_label] = customFieldValues[field.field_name];
      }
    });
    return customFieldsToSend;
  }, [customFields, customFieldValues]);

  React.useEffect(() => {
    fetchCustomFields();
  }, [fetchCustomFields]);

  return {
    customFields,
    customFieldValues,
    setCustomFieldValues, // ✅ yeh line zaroor add karo
    isLoading,
    handleCustomFieldChange,
    validateCustomFields,
    getCustomFieldsForSubmission,
    refetch: fetchCustomFields
  };
}
