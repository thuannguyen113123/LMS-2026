import React, { useEffect, useState } from "react";
import {
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineSave,
  AiOutlineClose,
} from "react-icons/ai";
import { FaKey } from "react-icons/fa";
import { MdOpenInNew } from "react-icons/md";
import EditableField from "./EditableField";
import StatusBadge from "./StatusBadge";
import Switch from "./Switch";
import { FiRefreshCw, FiUsers } from "react-icons/fi";

const getValueByPath = (obj, path) => {
  if (!obj || !path) return "";

  return path.split(".").reduce((acc, key) => {
    if (acc === undefined || acc === null) return "";
    return acc[key];
  }, obj);
};

const DataRow = React.memo(
  ({
    item,
    onToggleActive,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    columns = [],
    columnsConfig = [],
    onInlineUpdate,
    onRolePermission,
    onViewDetails,
    onPublish,

    permissions,
    highlightRow,
    onResetProgress,
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(item);

    useEffect(() => {
      setEditData(item);
    }, [item]);

    const handleChange = (key, value) => {
      if (key.includes(".")) {
        const keys = key.split(".");
        setEditData((prev) => {
          const newData = structuredClone(prev);
          let current = newData;

          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }

          current[keys[keys.length - 1]] = value;
          return newData;
        });
      } else {
        setEditData((prev) => ({ ...prev, [key]: value }));
      }
    };

    const handleSave = () => {
      onInlineUpdate?.(editData, item);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditData(item);
      setIsEditing(false);
    };

    const getColumnConfig = (key) =>
      columnsConfig?.find((col) => col.key === key) || {};

    const getBooleanStatus = (key, value) => {
      if (key === "isActive") return value ? "active" : "inactive";
      if (key === "verified") return value ? "verified" : "unverified";
      if (key === "locked") return value ? "locked" : "unlocked";
      if (key === "isSystemRole") return value ? "system" : "custom";
      if (key === "isSystemModule") return value ? "system" : "custom";
      if (key === "isSystemPermission") return value ? "system" : "custom";
      if (key === "isPublished") return value ? "active" : "inactive";
      if (key === "shuffleQuestions") return value ? "active" : "inactive";
      if (key === "shuffleOptions") return value ? "active" : "inactive";
      if (key === "published") return value ? "published" : "draft";

      return value;
    };

    const hasEditableColumn = columns.some((col, idx) => {
      const key = col.key || col.path || `col-${idx}`;
      return !!getColumnConfig(key).editableType;
    });

    return (
      <tr
        className={`table-tr hover:bg-gray-50 transition-colors ${
          highlightRow ? "bg-primary-soft" : ""
        }`}
      >
        {/* checkbox */}
        <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-4 w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(item.id)}
          />
        </td>

        {/* data cells */}
        {columns.map((col, idx) => {
          const key = col.key || col.path || `col-${idx}`;
          const config = getColumnConfig(key);

          const cellValue = getValueByPath(item, col.path || key);
          const editValue =
            config.editableType === "select"
              ? editData[key]
              : getValueByPath(editData, col.path || key);

          const canEdit = isEditing && config.editableType;

          return (
            <td
              key={key}
              className="px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs sm:text-sm lg:text-[14px] xl:text-[15px] text-primary whitespace-normal"
            >
              {canEdit ? (
                <EditableField
                  type={config.editableType}
                  value={editValue}
                  onChange={(val) => handleChange(key, val)}
                  options={config.options || []}
                />
              ) : col.type === "status" ? (
                <StatusBadge status={cellValue} />
              ) : col.type === "boolean" ? (
                <StatusBadge status={getBooleanStatus(key, cellValue)} />
              ) : col.render ? (
                col.render(item)
              ) : Array.isArray(cellValue) ? (
                cellValue.join(", ")
              ) : typeof cellValue === "object" && cellValue !== null ? (
                JSON.stringify(cellValue)
              ) : (
                <span className="block max-w-[120px] sm:max-w-40 lg:max-w-[220px] xl:max-w-[280px] 2xl:max-w-[340px]  truncate">
                  {cellValue ?? ""}
                </span>
              )}
            </td>
          );
        })}

        {/* actions */}
        <td className="table-td">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-end">
            {isEditing ? (
              <>
                <button
                  className="flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-800"
                  onClick={handleSave}
                >
                  <AiOutlineSave />{" "}
                  <span className="hidden sm:inline">Save</span>
                </button>

                <button
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-800"
                  onClick={handleCancel}
                >
                  <AiOutlineClose /> Cancel
                </button>
              </>
            ) : (
              <>
                {/* toggle active */}
                {onToggleActive && permissions.canEdit && (
                  <Switch
                    checked={item.isActive}
                    onChange={() => onToggleActive?.(item)}
                  />
                )}

                {/* inline edit */}
                {onInlineUpdate && permissions.canEdit && hasEditableColumn && (
                  <button
                    className="text-indigo-600 hover:text-indigo-800"
                    onClick={() => setIsEditing(true)}
                    title="Edit inline"
                  >
                    <AiOutlineEdit size={18} />
                  </button>
                )}

                {/*  publish — restored */}
                {onPublish &&
                  permissions.canPublish &&
                  item.status !== "Published" &&
                  onPublish && (
                    <button
                      className="text-green-600 hover:underline"
                      onClick={() => onPublish(item.id)}
                    >
                      Publish
                    </button>
                  )}

                {/* open edit page */}
                {onEdit && permissions.canEdit && (
                  <button onClick={() => onEdit?.(item)}>
                    <MdOpenInNew size={18} />
                  </button>
                )}

                {/* role permission */}
                {onRolePermission && (
                  <button onClick={() => onRolePermission(item)}>
                    <FaKey />
                  </button>
                )}

                {/* view members */}
                {onViewDetails && (
                  <button onClick={() => onViewDetails(item.id)}>
                    {" "}
                    <FiUsers />
                  </button>
                )}
                {/* ✅ reset progress */}
                {onResetProgress && (
                  <button
                    className="text-red-600 hover:text-red-800"
                    title="Reset Progress"
                    onClick={() => onResetProgress(item.id)}
                  >
                    <FiRefreshCw />
                  </button>
                )}

                {/* delete */}
                {onDelete && permissions.canDelete && (
                  <button onClick={() => onDelete?.(item.id)}>
                    <AiOutlineDelete size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    );
  }
);

export default DataRow;
