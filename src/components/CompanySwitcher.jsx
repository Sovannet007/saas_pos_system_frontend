import { Select, Typography } from "antd";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

const { Text } = Typography;

export default function CompanySwitcher({ onSwitched }) {
  const { user, companies, selectCompany, isSystemOwner } = useAuth();
  const [loadingId, setLoadingId] = useState(0);

  if (!isSystemOwner || !companies?.length) return null;

  const value = user?.company_id || undefined;

  const onChange = async (companyId) => {
    try {
      setLoadingId(companyId);
      await selectCompany(companyId);
      // tell parent to re-fetch data if needed
      onSwitched?.(companyId);
    } finally {
      setLoadingId(0);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Text type="secondary">ក្រុមហ៊ុន</Text>
      <div className="min-w-[240px]">
        {loadingId ? (
          <Spinner label="សូមអត់ធ្មត់រង់ចាំ..." />
        ) : (
          <Select
            value={value}
            style={{ width: "100%" }}
            placeholder="ជ្រើសរើសក្រុមហ៊ុន"
            onChange={onChange}
            options={companies.map((c) => ({
              label: `${c.company_name} (${c.company_code})`,
              value: c.company_id,
            }))}
          />
        )}
      </div>
    </div>
  );
}
