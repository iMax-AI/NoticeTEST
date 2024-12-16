"use client";

import React from "react";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar"; // Importing Navbar component
import { useSession } from "next-auth/react";
import { handleSignOut } from "../actions/authActions";

interface HistoryItem {
  pdf_upload_count: number;
  notice_generate_count:  number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [countData, setCountData] = useState<HistoryItem[]>([]);
  const [pdfUploadCount, setPdfUploadCount] = useState<number>(0);
  const [noticeGenerateCount, setNoticeGenerateCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/getUploadCount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID: session.user.id
          })
        });

        const data = await response.json();
        setCountData(data.data);
        setPdfUploadCount(data.data.pdf_upload_count);
        setNoticeGenerateCount(data.data.notice_generate_count);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };

    fetchData();
  }, [session]);

  const onSignOut = async () => {
    await handleSignOut();
    window.location.reload();
    window.location.href = "/";
  };

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="pt-20 bg-gray-100 min-h-screen">
        {/* Header Section */}
        <div className="w-full bg-black py-8">
          <div className="ml-8">
            <h2 className="text-white text-sm mb-1">Your Profile</h2>
            <h1 className="font-bold text-3xl md:text-4xl text-white">
              Profile Details
            </h1>
          </div>
        </div>

        {/* Profile Content */}
        <div className="min-h-[85vh] w-full flex items-start justify-center px-4 mt-4 mb-0">
          {/* Card Section */}
          <div
            className="relative w-full max-w-[1100px] mx-auto rounded-md md:rounded-lg p-6 shadow-md bg-gray-300"
            style={{
              width: "90%",
              maxWidth: "1100px",
            }}
          >
            <h1 className="font-bold text-lg md:text-xl text-black text-left">
              Profile Information
            </h1>

            {/* User Information */}
            <div className="text-black mt-4 space-y-2">
              <p>
                <strong>Username:</strong> {session?.user?.fullname || "Guest"}
              </p>
              <p>
                <strong>Email:</strong> {session?.user?.email || "Guest"}
              </p>
              <p>
                <strong>Total PDF Uploaded:</strong>{" "}
                {String(pdfUploadCount) || "0"}
              </p>
              <p>
                <strong>Total Responses Generated:</strong>{" "}
                {String(noticeGenerateCount) || "0"}
              </p>
              <p>
                <strong>Email Verified:</strong>{" "}
                {String(session?.user?.isEmailVerified) || "False"}
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="cursor-pointer px-4 py-2 mt-4 bg-gray-800 text-white rounded-md inline-block"
              style={{ backgroundColor: "#333333" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}