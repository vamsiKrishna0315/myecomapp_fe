'use client';

import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { Input, InputGroup, InputRightElement, IconButton } from "@chakra-ui/react";
import React from "react";

export function PasswordInput({ password, setPassword, placeholder = "Enter password" }) {
  const [show, setShow] = React.useState(false);

  const handleClick = () => setShow(!show);

  return (
    <InputGroup size="md">
      <Input
        pr="3.5rem"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <InputRightElement width="3rem">
        <IconButton
          h="1.75rem"
          size="sm"
          onClick={handleClick}
          icon={show ? <ViewOffIcon /> : <ViewIcon />}
          aria-label={show ? "Hide password" : "Show password"}
          variant="ghost"
        />
      </InputRightElement>
    </InputGroup>
  );
}
