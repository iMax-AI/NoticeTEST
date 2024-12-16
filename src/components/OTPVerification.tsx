"use client";

import { useEffect, useState } from 'react';


import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { handelResendVerficationCode } from "@/app/actions/authActions";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import ConfirmPassword from "@/components/ConfirmPassword";

const REGEXP_ONLY_DIGITS = /^\d+$/;


const OTPSchema = z.object({
    email: z.string().min(1, "Email is required.").email("Invalid email"),
    pin: z
      .string()
      .length(6, {
        message: "Your one-time password must be 6 characters.",
      })
      .regex(REGEXP_ONLY_DIGITS, "OTP must contain only digits"),
});

interface VerifyOTPProps {
    email: string;
}

import GlobalMessage from "@/components/GlobalMessage";

import { redirect } from 'next/navigation';

import emailjs from "emailjs-com";
// emailjs.init(process.env.NEXT_PUBLIC_EMAIL_JS_PUBLIC_KEY ?? "");

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



const VerifyOTP = ({ email }: VerifyOTPProps) => {
  const [countdown, setCountdown] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyCodeExpiry, setVerifyCodeExpiry] = useState(
    new Date(Date.now() + 15*60*1000)
  );

  const [verified, setVerified] = useState(false);

  const [globalMessage, setGlobalMessage] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("none");

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: {
      email: email,
      pin: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsResendEnabled(true);
    }
  }, [countdown]);


  const handleResendClick = async () => {
    setCountdown(30);
    setIsResendEnabled(false);
    setVerifyCode(Math.floor(100000 + Math.random() * 900000).toString());
    setVerifyCodeExpiry(new Date(Date.now() + 15*60*1000));

    // const result = await handelResendVerficationCode({
    //   email,
    //   verifyCode,
    //   verifyCodeExpiry,
    // });

    const result = await fetch("/api/resend-verifyCode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({email, verifyCode, verifyCodeExpiry}),
    });

    const resultData = await result.json();
    if (resultData?.success) {
      setGlobalMessage(resultData.message);
      setGlobalSuccess("true");
      await sendOTPEmail({
        email: email,
        otp: verifyCode,
      });
    } else {
      setGlobalMessage(resultData.message);
      setGlobalSuccess("false");
    }
  };


  const onSubmit = async (data: z.infer<typeof OTPSchema>) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (response.ok) {
        setVerified(true);
      } else {
        setGlobalMessage(responseData.message);
        setGlobalSuccess("false");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setGlobalMessage("Something went wrong. Please try again.");
      setGlobalSuccess("false");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-center font-inter">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-24">
        {!verified ? (
          <div className="flex justify-center">
            <div className="max-w-md mx-auto border-dotted border-4 border-black text-center px-4 sm:px-8 py-10 rounded-xl shadow">
            {globalMessage && (
              <GlobalMessage success={globalSuccess} message={globalMessage} onReset={() => setGlobalSuccess("none")} />
            )}
              <header className="mb-6">
                <h1 className="text-2xl text-black font-bold mb-1">Re-Set Password: OTP</h1>
                <p className="text-[15px] text-slate-700">
                  Enter the 6-digit verification code sent to your Email.
                </p>
              </header>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
                  <FormField
                    control={form.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputOTP
                            value={field.value}
                            onChange={(otp) => field.onChange(otp)}
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS.source}
                          >
                            <InputOTPGroup>
                              {[0, 1, 2, 3, 4, 5].map((index) => (
                                <InputOTPSlot
                                  key={index}
                                  index={index}
                                  className={'text-black border-black text-center w-12 h-12 mx-1 rounded-lg border transition-all duration-200'}
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <button
                    className="cursor-pointer px-4 py-2 mt-6 bg-[#222] relative group/btn w-full text-white rounded-md h-10 font-medium hover:bg-[#333] shadow-lg transition-all duration-[300ms]"
                    type="submit"
                  >
                    {isSubmitting ? (
                      <>
                        <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-gray-200 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M100..." fill="#1C64F2"/>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        Verify Code &rarr;
                      </>
                    )}
                  </button>

                  <div className="text-l text-slate-900 mt-4">
                    Did not receive code?{' '}
                    <button
                      onClick={handleResendClick}
                      disabled={!isResendEnabled}
                      className={`font-bold text-base bg-clip-text ${isResendEnabled ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'text-gray-400'}`}
                    >
                      Resend {countdown > 0 ? `in ${countdown}s` : ''}
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        ) : (
          <ConfirmPassword email={email} />
        )}
      </div>
    </main>
  );
};

export default VerifyOTP;

// const BottomGradient = () => {
//   return (
//     <>
//       <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
//       <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-full mx-auto -bottom-px inset-x-px bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
//     </>
//   );
// };