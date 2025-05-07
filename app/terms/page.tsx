import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-8 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Terms of Use</CardTitle>
          <CardDescription>Last Updated: May 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold mt-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the AI Mocker Mock Record Generator (&quot;Service&quot;), you agree to be bound by these Terms of Use (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
          </p>
          
          <h2 className="text-xl font-semibold mt-4">2. Description of Service</h2>
          <p>
            AI Mocker provides a tool for generating realistic mock data using artificial intelligence models from various providers. The Service allows users to input schemas or sample data and receive AI-generated mock records for testing and development purposes.
          </p>
          
          <h2 className="text-xl font-semibold mt-4">3. User Responsibilities</h2>
          <p>
            3.1. <strong>API Keys:</strong> When using the Service, you may provide your own API keys for third-party AI providers. You acknowledge that:
          </p>
          <ul className="list-disc pl-8 my-2">
            <li>You are solely responsible for safeguarding your API keys.</li>
            <li>While we store your API keys in your browsers localStorage and do not permanently store them on our servers, they are transmitted to our servers during generation requests.</li>
            <li>You are responsible for any charges incurred through the use of your API keys with our Service.</li>
            <li>You must comply with all terms of service of the third-party API providers when using their services through our platform.</li>
          </ul>
          
          <p>
            3.2. <strong>Generated Content:</strong> You are solely responsible for:
          </p>
          <ul className="list-disc pl-8 my-2">
            <li>The schemas, prompts, or sample data you input into the Service.</li>
            <li>All content generated using the Service.</li>
            <li>Ensuring that your use of the generated content complies with applicable laws and regulations.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-4">4. Prohibited Uses</h2>
          <p>
            You agree not to use the Service to:
          </p>
          <ul className="list-disc pl-8 my-2">
            <li>Generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
            <li>Generate content that infringes upon intellectual property rights or violates privacy rights of others.</li>
            <li>Attempt to reverse engineer, decompile, or disassemble any portion of the Service.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or any system or network connected to the Service.</li>
            <li>Use the Service to generate realistic personal data for fraudulent purposes.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-4">5. Disclaimer of Warranties</h2>
          <p>
            5.1. THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
          <p>
            5.2. We do not guarantee that:
          </p>
          <ul className="list-disc pl-8 my-2">
            <li>The Service will meet your specific requirements.</li>
            <li>The Service will be uninterrupted, timely, secure, or error-free.</li>
            <li>The results obtained from using the Service will be accurate or reliable.</li>
            <li>The quality of any products, services, information, or other material purchased or obtained through the Service will meet your expectations.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-4">6. Limitation of Liability</h2>
          <p>
            6.1. TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL AI MOCKER, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className="list-disc pl-8 my-2">
            <li>Your access to or use of or inability to access or use the Service.</li>
            <li>Any conduct or content of any third party on the Service.</li>
            <li>Any content obtained from the Service.</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            <li>Any charges incurred through the use of your third-party API keys.</li>
            <li>Any use or misuse of generated mock data.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-4">7. Data Security</h2>
          <p>
            7.1. While we implement reasonable security measures to protect your information, no method of transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee absolute security.
          </p>
          <p>
            7.2. We store your API keys in your browsers localStorage, not in our database. However, these keys are transmitted to our servers during generation requests to facilitate API calls to third-party providers.
          </p>
          
          <h2 className="text-xl font-semibold mt-4">8. Modifications to Service and Terms</h2>
          <p>
            8.1. We reserve the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
          </p>
          <p>
            8.2. We reserve the right to change these Terms at any time. Updated Terms will be posted on this page with a revised &quot;Last Updated&quot; date.
          </p>
          <p>
            8.3. Your continued use of the Service after any changes to the Terms constitutes your acceptance of the new Terms.
          </p>
          
          <h2 className="text-xl font-semibold mt-4">9. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which AI Mocker operates, without regard to its conflict of law provisions.
          </p>
          
          <h2 className="text-xl font-semibold mt-4">10. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us through our GitHub repository.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 