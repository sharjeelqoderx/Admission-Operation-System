
"use client"

import React, { useState, useEffect, useRef } from "react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function PhoneInputComponent({
  value,
  onChange,
  className,
  placeholder,
  disabled,
}: PhoneInputProps) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 999999999,
      }}
    >
      <PhoneInput
        country={"us"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        inputStyle={{
          width: "100%",
          height: "50px",
          border: "none",
          borderRadius: "0.125rem",
          // paddingLeft: "60px",
          backgroundColor: "#F3F4F6",
          color: "#1f2937",
          fontSize: "0.875rem",
          outline: "none",
          boxSizing: "border-box",
        }}
        buttonStyle={{
          border: "none",
          borderRadius: "0.125rem 0 0 0.125rem",
          backgroundColor: "#F3F4F6",
          height: "50px",
          boxSizing: "border-box",
        }}
        dropdownStyle={{
          backgroundColor: "#FFFFFF",
          zIndex: 9999999999,
          maxHeight: "300px",
          overflowY: "auto",
          padding: "0px 6px",
          overflowX: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          borderRadius: "0.5rem",
        }}
        enableSearch
        searchStyle={{
          width: "100%",
          height: "40px",
          marginLeft: "0px",
          borderBottom: "1px solid #E5E7EB",
        }}
        searchPlaceholder="Search country"
        specialLabel=""
      />
    </div>
  )
}
