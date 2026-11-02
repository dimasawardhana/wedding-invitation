"use client";

import SafeImage from "@/components/ui/SafeImage";
import { motion, type Variants } from "framer-motion";
import { InvitationData } from "@/hooks/useInvitation";

type Props = {
  groom: InvitationData["groom"];
  bride: InvitationData["bride"];
  accentColor?: string;
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const groomVariants: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const brideVariants: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const separatorVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

type ProfileProps = {
  fullName: string;
  photo: string;
  fatherName: string;
  motherName: string;
  order: string;
  variants: Variants;
  accentColor?: string;
};

function Profile({ fullName, photo, fatherName, motherName, order, variants, accentColor = "#C9A96E" }: ProfileProps) {
  return (
    <motion.div
      variants={variants}
      className="flex flex-col items-center gap-3 px-8"
    >
      <div className="relative w-24 h-24 rounded-full ring-offset-2 ring-offset-[#F8F5F2] overflow-hidden shrink-0" style={{ outline: `1px solid ${accentColor}` }}>
        <SafeImage src={photo} alt={fullName} className="object-cover" variant="photo" />
      </div>

      <motion.h2
        className="font-playfair text-2xl font-bold text-stone-800 text-center tracking-wide"
        initial={{ letterSpacing: "0.05em" }}
        animate={{ letterSpacing: "0.08em" }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
      >
        {fullName}
      </motion.h2>

      <p className="font-sans text-sm font-light text-stone-500 text-center leading-relaxed">
        {order}
        <br />
        <span className="text-stone-600">{fatherName}</span>
        <span className="text-stone-400"> &amp; </span>
        <span className="text-stone-600">{motherName}</span>
      </p>
    </motion.div>
  );
}

export default function CoupleDetail({ groom, bride, accentColor = "#C9A96E" }: Props) {
  return (
    <div className="h-full w-full bg-[#F8F5F2] flex flex-col items-center justify-center py-10">
      <motion.div
        className="flex flex-col items-center justify-center gap-6 w-full max-w-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Profile
          fullName={groom.fullName}
          photo={groom.photo}
          fatherName={groom.fatherName}
          motherName={groom.motherName}
          order={groom.order}
          variants={groomVariants}
          accentColor={accentColor}
        />
        
        <motion.div
          variants={separatorVariants}
          className="flex flex-col items-center gap-2 py-1"
        >
          <span className="block w-px h-8" style={{ backgroundColor: `${accentColor}4d` }} />
          <span className="font-playfair text-4xl select-none leading-none" style={{ color: accentColor, opacity: 0.5 }}>
            &amp;
          </span>
          <span className="block w-px h-8" style={{ backgroundColor: `${accentColor}4d` }} />
        </motion.div>
        
        <Profile
          fullName={bride.fullName}
          photo={bride.photo}
          fatherName={bride.fatherName}
          motherName={bride.motherName}
          order={bride.order}
          variants={brideVariants}
          accentColor={accentColor}
        />
      </motion.div>
    </div>
  );
}
