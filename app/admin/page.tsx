"use client";

import { useState, useEffect, useCallback } from "react";

interface DocumentMetadata {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  status: "pending" | "processing" | "done" | "error";
  type: "pdf" | "docx";
  questionCount?: number;
  error?: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  }, []);

  useEffect(() => {
    // Check if password is stored in session
    const stored = sessionStorage.getItem("adminAuth");
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchDocuments, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchDocuments]);

  const handleLogin = async () => {
    setAuthError("");

    // Test the password by trying to fetch documents
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        sessionStorage.setItem("adminAuth", password);
        setIsAuthenticated(true);
      } else {
        setAuthError("Invalid password");
      }
    } catch {
      setAuthError("Connection error");
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${password}`,
          },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Upload failed"
        );
      }
    }

    setIsUploading(false);
    fetchDocuments();
  };

  const handleProcess = async (documentId: string) => {
    setProcessingId(documentId);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ documentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Processing failed");
      }

      fetchDocuments();
    } catch (error) {
      console.error("Process error:", error);
      fetchDocuments();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Delete this document?")) return;

    try {
      await fetch("/api/documents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ id: documentId }),
      });
      fetchDocuments();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Access</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                placeholder="Enter admin password"
              />
            </div>
            {authError && (
              <p className="text-sm text-red-600">{authError}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Admin - Document Upload
            </h1>
            <a href="/" className="text-sm text-primary-600 hover:underline">
              &larr; Back to Template Builder
            </a>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("adminAuth");
              setIsAuthenticated(false);
              setPassword("");
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">
            Upload New Poll Instrument
          </h2>

          <label
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isUploading
                ? "border-gray-300 bg-gray-50"
                : "border-gray-300 hover:border-primary-500 hover:bg-primary-50"
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-6 w-6 text-primary-600"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="w-10 h-10 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    .docx or .pdf files only
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              multiple
              disabled={isUploading}
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>

          {uploadError && (
            <p className="mt-3 text-sm text-red-600">{uploadError}</p>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Uploaded Documents ({documents.length})
            </h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No documents uploaded yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      {doc.questionCount !== undefined && (
                        <span className="ml-2">
                          | {doc.questionCount} questions
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    {/* Status badge */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        doc.status === "done"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "processing"
                          ? "bg-yellow-100 text-yellow-800"
                          : doc.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {doc.status === "done"
                        ? "Processed"
                        : doc.status === "processing"
                        ? "Processing..."
                        : doc.status === "error"
                        ? "Error"
                        : "Pending"}
                    </span>

                    {/* Process button */}
                    {doc.status === "pending" && (
                      <button
                        onClick={() => handleProcess(doc.id)}
                        disabled={processingId === doc.id}
                        className="text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 disabled:opacity-50"
                      >
                        {processingId === doc.id ? "Processing..." : "Process"}
                      </button>
                    )}

                    {/* Re-process button for errors */}
                    {doc.status === "error" && (
                      <button
                        onClick={() => handleProcess(doc.id)}
                        disabled={processingId === doc.id}
                        className="text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50"
                      >
                        Retry
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error display */}
        {documents.some((d) => d.error) && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="font-medium text-red-800 mb-2">Processing Errors</h3>
            {documents
              .filter((d) => d.error)
              .map((doc) => (
                <p key={doc.id} className="text-sm text-red-700">
                  {doc.name}: {doc.error}
                </p>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
