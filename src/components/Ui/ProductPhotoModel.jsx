import { useState, useEffect } from "react";
import { Modal, Button, Typography, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { uploadProductPhoto, deleteProductPhoto } from "../../services/api";

const { Title } = Typography;

export default function ProductPhotoModal({
  open,
  onClose,
  productId,
  defaultPhoto,
  otherPhotos = [],
  onSaved,
}) {
  const [defaultImg, setDefaultImg] = useState(defaultPhoto || null);
  const [optionalImgs, setOptionalImgs] = useState(otherPhotos);

  useEffect(() => {
    setDefaultImg(defaultPhoto || null);
    setOptionalImgs(otherPhotos || []);
  }, [defaultPhoto, otherPhotos]);

  // 📌 Upload file with preview + FormData
  const handleUpload = async (file, isDefault = false) => {
    const preview = URL.createObjectURL(file); // local preview

    if (isDefault) {
      setDefaultImg(preview);
    } else {
      setOptionalImgs((prev) => [...prev, preview]);
    }

    const formData = new FormData();
    formData.append("file", file); // 👈 must match backend [FromForm] name
    formData.append("productId", productId);
    formData.append("isDefault", isDefault ? 1 : 0);

    try {
      const res = await uploadProductPhoto(formData);

      if (res.data?.code === 0) {
        const serverPath = res.data?.filePath || res.data?.FilePath;
        if (serverPath) {
          if (isDefault) {
            setDefaultImg(serverPath);
          } else {
            setOptionalImgs((prev) => [
              ...prev.filter((p) => p !== preview), // remove preview
              serverPath,
            ]);
          }
        }
        message.success("Uploaded successfully");
        onSaved?.();
      } else {
        message.error(res.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      message.error("Upload failed: " + err.message);
    }
  };

  // 📌 Delete photo
  const handleDelete = async (img, isDefault = false) => {
    try {
      const res = await deleteProductPhoto({
        productId,
        path: img,
        isDefault,
      });

      if (res.data?.code === 0) {
        if (isDefault) {
          setDefaultImg(null);
        } else {
          setOptionalImgs((prev) => prev.filter((p) => p !== img));
        }
        message.success("Deleted successfully");
        onSaved?.();
      } else {
        message.error(res.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      message.error("Delete failed: " + err.message);
    }
  };

  // 📌 Trigger file picker
  const handleFileSelect = (e, isDefault = false) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file, isDefault);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      title={
        <span className="font-semibold text-lg">Manage Product Photos</span>
      }
      footer={null}
      centered
      destroyOnClose
    >
      {/* 🔹 Default Photo Frame */}
      {/* <div className="mb-8 border rounded-lg p-4">  */}

      <Title level={5}>Default Photo</Title>
      <div className="flex items-start gap-4">
        {defaultImg ? (
          <div className="relative border rounded-lg p-2 w-64 h-44 flex items-center justify-center bg-gray-50">
            <img
              src={defaultImg}
              alt="default"
              className="max-h-full max-w-full object-contain rounded-md"
            />
            <Button
              type="primary"
              danger
              shape="circle"
              size="small"
              icon={<DeleteOutlined />}
              className="absolute top-2 right-2"
              onClick={() => handleDelete(defaultImg, true)}
            />
          </div>
        ) : (
          <label className="border border-dashed border-gray-400 rounded-lg w-64 h-44 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition">
            <PlusOutlined className="text-2xl mb-2 text-blue-500" />
            <span>Upload Default</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFileSelect(e, true)}
            />
          </label>
        )}
      </div>
      {/*  </div> */}

      {/* 🔹 Optional Photos Frame */}
      <div className="border rounded-lg p-4">
        <Title level={5}>រូបភាពទំនិញ</Title>
        <div className="grid grid-cols-4 gap-4">
          {optionalImgs.map((img, idx) => (
            <div
              key={idx}
              className="relative border rounded-lg w-full h-32 flex items-center justify-center bg-gray-50"
            >
              <img
                src={img}
                alt={`optional-${idx}`}
                className="max-h-full max-w-full object-contain rounded-md"
              />
              <Button
                type="primary"
                danger
                shape="circle"
                size="small"
                icon={<DeleteOutlined />}
                className="absolute top-1 right-1"
                onClick={() => handleDelete(img, false)}
              />
            </div>
          ))}

          {/* Upload New */}
          <label className="border border-dashed border-gray-400 rounded-lg w-full h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition">
            <PlusOutlined className="text-2xl mb-1 text-blue-500" />
            <span>Add</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFileSelect(e, false)}
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}
