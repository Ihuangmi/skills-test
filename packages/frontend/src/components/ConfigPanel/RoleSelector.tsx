// 角色选择器组件
import React from 'react';
import { PRESET_ROLES } from '../../utils/roles';

interface RoleSelectorProps {
  selectedRoleId: string;
  onRoleSelect: (roleId: string) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRoleId,
  onRoleSelect,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 p-2">
      {PRESET_ROLES.map((role) => (
        <button
          key={role.id}
          onClick={() => onRoleSelect(role.id)}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedRoleId === role.id
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-border-default hover:border-border-hover'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{role.icon}</span>
            <span className="font-medium text-text-primary text-sm">
              {role.name}
            </span>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">
            {role.description}
          </p>
        </button>
      ))}
    </div>
  );
};

export default RoleSelector;
