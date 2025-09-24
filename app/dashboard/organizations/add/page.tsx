"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import LoadingScreen from "@/components/LoadingScreen";

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
}

export default function AddOrganization() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("id");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!organizationId);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(!!organizationId);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    nicknames: "",
    parentOrganization: "",
    website: "",
    status: "Active",
    contractOnFile: "No",
    contractSignedBy: "",
    dateContractSigned: "",
    yearFounded: "",
    overview: "",
    permFee: "",
    numEmployees: "",
    numOffices: "",
    contactPhone: "",
    address: "",
    // Dynamic custom fields will be added here
    customFields: {} as Record<string, any>,
  });

  // Load custom field definitions
  useEffect(() => {
    fetchCustomFields();
  }, []);

  // If organizationId is present, fetch the organization data
  useEffect(() => {
    if (organizationId) {
      fetchOrganization(organizationId);
    }
  }, [organizationId, customFields]);

  const fetchCustomFields = async () => {
    try {
      const response = await fetch("/api/admin/field-management/organizations");
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

        setFormData((prev) => ({
          ...prev,
          customFields: customFieldValues,
        }));
      }
    } catch (err) {
      console.error("Error fetching custom fields:", err);
    }
  };

  const fetchOrganization = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch organization details"
        );
      }

      const data = await response.json();
      const org = data.organization;

      console.log("Received organization data:", org);

      // Parse existing custom fields
      let existingCustomFields: Record<string, any> = {};
      if (org.custom_fields) {
        try {
          existingCustomFields =
            typeof org.custom_fields === "string"
              ? JSON.parse(org.custom_fields)
              : org.custom_fields;
        } catch (e) {
          console.error("Error parsing existing custom fields:", e);
        }
      }

      // Merge existing custom fields with definitions
      const mergedCustomFields: Record<string, any> = {};
      customFields.forEach((field) => {
        mergedCustomFields[field.field_name] =
          existingCustomFields[field.field_name] || field.default_value || "";
      });

      setFormData({
        name: org.name || "",
        nicknames: org.nicknames || "",
        parentOrganization: org.parent_organization || "",
        website: org.website || "",
        status: org.status || "Active",
        contractOnFile: org.contract_on_file || "No",
        contractSignedBy: org.contract_signed_by || "",
        dateContractSigned: org.date_contract_signed
          ? org.date_contract_signed.split("T")[0]
          : "",
        yearFounded: org.year_founded || "",
        overview: org.overview || "",
        permFee: org.perm_fee ? org.perm_fee.toString() : "",
        numEmployees: org.num_employees ? org.num_employees.toString() : "",
        numOffices: org.num_offices ? org.num_offices.toString() : "",
        contactPhone: org.contact_phone || "",
        address: org.address || "",
        customFields: mergedCustomFields,
      });
    } catch (err) {
      console.error("Error fetching organization:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching organization details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldName]: value,
      },
    }));
  };

  const validateForm = () => {
    // Validate required standard fields
    if (!formData.name.trim()) {
      setError("Organization name is required");
      return false;
    }
    if (!formData.website.trim()) {
      setError("Website is required");
      return false;
    }
    if (!formData.overview.trim()) {
      setError("Organization overview is required");
      return false;
    }

    // Basic website URL validation
    if (
      !formData.website.startsWith("http://") &&
      !formData.website.startsWith("https://")
    ) {
      setError("Website must start with http:// or https://");
      return false;
    }

    // Validate required custom fields
    for (const field of customFields) {
      if (field.is_required && !field.is_hidden) {
        const value = formData.customFields[field.field_name];
        if (!value || (typeof value === "string" && !value.trim())) {
          setError(`${field.field_label} is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare custom fields for submission
      const customFieldsToSend: Record<string, any> = {};
      customFields.forEach((field) => {
        if (!field.is_hidden) {
          customFieldsToSend[field.field_label] =
            formData.customFields[field.field_name];
        }
      });

      const apiData = {
        name: formData.name,
        nicknames: formData.nicknames,
        parent_organization: formData.parentOrganization,
        website: formData.website,
        status: formData.status,
        contract_on_file: formData.contractOnFile,
        contract_signed_by: formData.contractSignedBy,
        date_contract_signed: formData.dateContractSigned || null,
        year_founded: formData.yearFounded,
        overview: formData.overview,
        perm_fee: formData.permFee,
        num_employees: formData.numEmployees
          ? parseInt(formData.numEmployees)
          : null,
        num_offices: formData.numOffices ? parseInt(formData.numOffices) : null,
        contact_phone: formData.contactPhone,
        address: formData.address,
        custom_fields: JSON.stringify(customFieldsToSend),
      };

      console.log(
        "Sending organization data to API:",
        JSON.stringify(apiData, null, 2)
      );

      let response;
      if (isEditMode && organizationId) {
        response = await fetch(`/api/organizations/${organizationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });
      } else {
        response = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });
      }

      const responseText = await response.text();
      console.log(
        `API ${isEditMode ? "update" : "create"} response:`,
        responseText
      );

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error("Failed to parse response:", error);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${isEditMode ? "update" : "create"} organization`
        );
      }

      const id = isEditMode ? organizationId : data.organization.id;
      router.push(`/dashboard/organizations/view?id=${id}`);
    } catch (err) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} organization:`,
        err
      );
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderCustomField = (field: CustomFieldDefinition) => {
    if (field.is_hidden) return null;

    const value = formData.customFields[field.field_name] || "";

    const fieldProps = {
      id: field.field_name,
      value: value,
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => handleCustomFieldChange(field.field_name, e.target.value),
      className:
        "w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500",
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
            onChange={(e) =>
              handleCustomFieldChange(field.field_name, e.target.checked)
            }
            className="h-4 w-4"
          />
        );
      case "number":
        return <input {...fieldProps} type="number" />;
      case "date":
        return <input {...fieldProps} type="date" />;
      case "email":
        return <input {...fieldProps} type="email" />;
      case "phone":
        return <input {...fieldProps} type="tel" />;
      case "url":
        return <input {...fieldProps} type="url" />;
      default:
        return <input {...fieldProps} type="text" />;
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading organization data..." />;
  }

  if (isSubmitting) {
    return (
      <LoadingScreen
        message={
          isEditMode ? "Updating organization..." : "Creating organization..."
        }
      />
    );
  }

  return (
    <div className="mx-auto py-4 px-4 sm:py-8 sm:px-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 relative">
        {/* Header with X button */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center">
            <Image
              src="/window.svg"
              alt="Organization"
              width={24}
              height={24}
              className="mr-2"
            />
            <h1 className="text-xl font-bold">
              {isEditMode ? "Edit" : "Add"} Organization
            </h1>
          </div>
          <button
            onClick={handleGoBack}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl font-bold">X</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* <div className="flex items-center">
                            <label className="w-48 font-medium">Organization Name:</label>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                    required
                                />
                                <span className="absolute text-red-500 left-[-10px] top-2">*</span>
                            </div>
                        </div>

                        
                        <div className="flex items-center">
                            <label className="w-48 font-medium">Nicknames:</label>
                            <input
                                type="text"
                                name="nicknames"
                                value={formData.nicknames}
                                onChange={handleChange}
                                className="flex-1 p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                placeholder="Alternate names for the organization"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Parent Organization:</label>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    name="parentOrganization"
                                    value={formData.parentOrganization}
                                    onChange={handleChange}
                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                    placeholder="Parent company name, if applicable"
                                />
                                <button type="button" className="absolute right-2 top-2">
                                    <Image src="/search.svg" alt="Search" width={16} height={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Organization Website:</label>
                            <div className="flex-1 relative">
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                    placeholder="https://www.example.com"
                                    required
                                />
                                <span className="absolute text-red-500 left-[-10px] top-2">*</span>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Contact Phone:</label>
                            <div className="flex-1">
                                <input
                                    type="tel"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. (123) 456-7890"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Address:</label>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                    placeholder="Organization address"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Status:</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Contract Signed on File:</label>
                            <select
                                name="contractOnFile"
                                value={formData.contractOnFile}
                                onChange={handleChange}
                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Contract Signed By:</label>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    name="contractSignedBy"
                                    value={formData.contractSignedBy}
                                    onChange={handleChange}
                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                    placeholder="Name of signatory"
                                />
                                <button type="button" className="absolute right-2 top-2">
                                    <Image src="/search.svg" alt="Search" width={16} height={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Date Contract Signed:</label>
                            <div className="flex-1 relative">
                                <input
                                    type="date"
                                    name="dateContractSigned"
                                    value={formData.dateContractSigned}
                                    onChange={handleChange}
                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                />
                                <button type="button" className="absolute right-2 top-2">
                                    <Image src="/calendar.svg" alt="Calendar" width={16} height={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Year Founded:</label>
                            <input
                                type="text"
                                name="yearFounded"
                                value={formData.yearFounded}
                                onChange={handleChange}
                                placeholder="YYYY"
                                className="flex-1 p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium align-top mt-2">Organization Overview:</label>
                            <div className="flex-1 relative">
                                <textarea
                                    name="overview"
                                    value={formData.overview}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    rows={4}
                                    placeholder="Provide a brief overview of the organization"
                                    required
                                />
                                <span className="absolute text-red-500 left-[-10px] top-2">*</span>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium">Standard Perm Fee (%):</label>
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    name="permFee"
                                    value={formData.permFee}
                                    onChange={handleChange}
                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. 20"
                                />
                                <span className="absolute right-2 top-2">%</span>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium"># of Employees:</label>
                            <input
                                type="number"
                                min="0"
                                name="numEmployees"
                                value={formData.numEmployees}
                                onChange={handleChange}
                                className="flex-1 p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                placeholder="Approximate number of employees"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="w-48 font-medium"># of Offices:</label>
                            <input
                                type="number"
                                min="0"
                                name="numOffices"
                                value={formData.numOffices}
                                onChange={handleChange}
                                className="flex-1 p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                placeholder="Number of office locations"
                            />
                        </div> */}

            {/* Custom Fields Section */}
            {customFields.length > 0 && (
              <>
                {/* <div className="mt-8 mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                        Additional Information
                                    </h3>
                                </div> */}

                {customFields.map((field) => (
                  <div key={field.id} className="flex items-center">
                    <label className="w-48 font-medium">
                      {field.field_label}:
                      {field.is_required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <div className="flex-1 relative">
                      {renderCustomField(field)}
                      {field.is_required && (
                        <span className="absolute text-red-500 left-[-10px] top-2">
                          *
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Form Buttons */}
          <div className="pt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleGoBack}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isSubmitting}
            >
              {isEditMode ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
