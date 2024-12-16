"use client";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import GlobalMessage from "@/components/GlobalMessage";
import OTPVerification from "@/components/OTPVerification"
// import { handelResendVerficationCode } from "@/app/actions/authActions";
// import { verify } from "crypto";

import emailjs from "emailjs-com";
// emailjs.init(process.env.NEXT_PUBLIC_EMAIL_JS_PUBLIC_KEY ?? "");

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const sendOTPEmail = async ({ email, otp }: { email: string; otp: string }) => {
  try {
    const templateParams = {
      from_name: "Notice Reply",
      to_email: email,
      subject: "Password Reset OTP",
      message: `Your OTP code for password reset is: ${otp}
      This code is valid for the next 15 minutes.`,
    };

    const response = await emailjs.send(
      "service_gfpypir",
      "template_plvqxcg",
      templateParams,
      "TukdaH2sl4cOtqwja"
    );
    return response;

  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

export default function ForgotPasswordForm() {
  const [globalMessage, setGlobalMessage] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("none");
  const [isSuccess, setSuccess] = useState(false);
  const [sendEmail, setSendEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    try {
      setSendEmail(values.email);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const verifyCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

      const response = await fetch("/api/resend-verifyCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, verifyCode: otp, verifyCodeExpiry }),
    });

      console.log(response);

      // const result = await sendOTPEmail({
      //   email: values.email,
      //   otp: otp,
      // });

      if (response.ok) {
        const result = await sendOTPEmail({
          email: values.email,
          otp: otp,
        });
        if(result)

        if (result.status === 200) {
          setGlobalMessage("OTP sent successfully!");
          setGlobalSuccess("true");
          setSuccess(true);
        }
      }
      else {
        setGlobalSuccess("false");
        setGlobalMessage("User not found, enter a valid email address.");
      }
    } catch (error) {
      setGlobalSuccess("false");
      setGlobalMessage("Failed to send OTP. Please try again.");
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      {!isSuccess ? (
        <>
          <div className="mb-6">
            <Image src="/logo.png" alt="Logo" width={125} height={125} />
          </div>
          <Card className="border-slate-950 shadow-md">
            {globalMessage && (
              <GlobalMessage success={globalSuccess} message={globalMessage} onReset={() => setGlobalSuccess("none")} />
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold">Forget Password</CardTitle>
              <CardDescription>
                Enter your email to receive a password reset code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4 mb-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="test1234@gmail.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                <CardFooter className="flex flex-col -mb-6">
                  <Button className="w-full" type="submit">
                    {isSubmitting ? (
                      <>
                        <svg
                          aria-hidden="true"
                          role="status"
                          className="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600"
                          viewBox="0 0 100 101"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor"
                          />
                          <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="#1C64F2"
                          />
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>Send OTP &rarr;</>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <OTPVerification email={sendEmail} />
      )}
    </div>
  );
}