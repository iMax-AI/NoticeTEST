import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Other Next.js config options
  async rewrites() {
    return [
      {
        source: "/api/uploadPdf-python",
        destination: "http://sastelaptop.com:3010/api/uploadGooglePdf",
      },
      {
        source: "/api/fetchNumPages-python",
        destination: "http://sastelaptop.com:3010/api/fetchNumPages"
      },
      {
        source: "/api/fetchQnAs-python",
        destination: "http://sastelaptop.com:3010/api/fetchQnAs"
      },
      {
        source: "/api/getNoticeReply-python",
        destination: "http://sastelaptop.com:3010/api/getNoticeReply"
      },
      {
        source: "/api/getSummonNoticeReply-python",
        destination: "http://sastelaptop.com:3010/api/getSummonNoticeReply"
      }
    ];
  },
};

export default nextConfig;
