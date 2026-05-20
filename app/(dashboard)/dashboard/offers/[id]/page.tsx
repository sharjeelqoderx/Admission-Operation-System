'use client';

import React from 'react';
import { Typography } from '@/components/shared/Typography';
import { Button } from '@/components/ui/button';
import { BluryCard } from '@/components/shared/blury-card';
import { useParams } from 'next/navigation';

const studentDetail = {
  name: 'Mike',
  email: 'mike@gmail.com',
  phone: '+123-456-7890',
  dob: 'mm/dd/yyyy',
  zip: '781064',
  nationality: 'Spain',
  address: 'Xyz Street',
};

export default function OfferDetailPage() {
  const params = useParams();
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Column: Details */}
        <div className="w-full md:w-1/3 space-y-6">
          <Typography font="heading" className="text-slate-900 border-b border-slate-300 pb-2 mb-8">
            Student Detail
          </Typography>
          
          <div className="space-y-4">
            <DetailItem label="Name:" value={studentDetail.name} />
            <DetailItem label="Email:" value={studentDetail.email} />
            <DetailItem label="Phone:" value={studentDetail.phone} />
            <DetailItem label="Date Of Birth:" value={studentDetail.dob} />
            <DetailItem label="Zip-Code:" value={studentDetail.zip} />
            <DetailItem label="Nationality:" value={studentDetail.nationality} />
            <DetailItem label="Address:" value={studentDetail.address} />
          </div>
        </div>

        {/* Right Column: Document Preview */}
        <div className="w-full md:w-2/3">
          <BluryCard isCentered={false} className="bg-slate-200/50 border-white/40 p-4 rounded-xl min-h-[600px] flex items-center justify-center">
            <div className="bg-white w-full h-full min-h-[700px] rounded shadow-lg p-10 flex flex-col items-center">
              {/* Fake Document Content */}
              <div className="w-full flex justify-start mb-20">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-bl-xl flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
                    </div>
                    <div className="leading-tight">
                        <p className="font-extrabold text-[12px] tracking-tight">Fachhochschule</p>
                        <p className="font-extrabold text-[12px] tracking-tight">des Mittelstands</p>
                        <p className="text-[8px] font-bold text-slate-400">UNIVERSITY OF APPLIED SCIENCES</p>
                    </div>
                 </div>
              </div>

              <div className="w-full space-y-6 text-slate-700 text-[11px] leading-relaxed max-w-md mx-auto mt-10">
                <p>Dear Student,</p>
                <p>Thank you for submitting your online application! We're excited to have you attend Mid-Plains Community College!</p>
                <p>You have indicated that you are not, at the present time, 18 years of age. MPCC's policy indicates that for billing purposes, you must be 18 years of age at the time of admission or have a parent/guardian signature.</p>
                <p>Would you please sign, and have your parent/guardian sign, the attached form and return it to:</p>
                <div className="pl-10 space-y-1">
                    <p>Attn: Admissions</p>
                    <p>Mid-Plains Community College</p>
                    <p>1101 Halligan Dr</p>
                    <p>North Platte, NE 69101</p>
                </div>
                <p>Should you have questions, feel free to contact me at 308-535-3609 or 800-658-4308 extension 3609.</p>
                <p>Best wishes,</p>
                <p className="italic font-serif text-[18px] text-slate-400">April</p>
                <p>Admissions</p>
              </div>

              <div className="mt-auto w-full pt-10 border-t border-slate-100 flex justify-between items-end">
                 <div className="text-[7px] text-slate-400 space-y-0.5">
                    <p>Mid-Plains Community College</p>
                    <p>1101 Halligan Drive</p>
                    <p>North Platte, NE 69101</p>
                    <p>308-535-3600</p>
                    <p>800-658-4308 Ext. 3609</p>
                 </div>
                 <div className="text-[7px] text-slate-400 text-right space-y-0.5">
                    <p>McCook Community College</p>
                    <p>North Platte Community College</p>
                    <p>Broken Bow, Ogallala, and</p>
                    <p>Valentine Extended Campuses</p>
                 </div>
              </div>
            </div>
          </BluryCard>

          {/* Action Button */}
          <div className="mt-6 flex justify-end">
            <Button className="bg-[#9333FF] hover:bg-[#8229E6] text-white font-semibold py-6 px-8 rounded-lg shadow-lg">
              Share Link With Student To Get Consent
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-12">
      <Typography font="sub-text" className="font-bold text-slate-900 min-w-[120px]">
        {label}
      </Typography>
      <Typography font="sub-text" className="text-slate-900">
        {value}
      </Typography>
    </div>
  );
}
