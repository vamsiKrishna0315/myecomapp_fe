'use client';

import React from "react";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
} from "@chakra-ui/react";
import MainPage from "../Cart/Mainpage";

export default function Bag_Drawer({ onClose, isOpen }) {
  return (
    <Drawer
      placement="right"
      onClose={onClose}
      isOpen={isOpen}
      size="md"
    >
      <DrawerOverlay bg="black/50" backdropFilter="blur(4px)" />
      <DrawerContent className="!w-full sm:!max-w-[440px] !bg-gray-50 !p-0 shadow-2xl flex flex-col h-full overflow-hidden">
        <MainPage isOpen={isOpen} onClose={onClose} />
      </DrawerContent>
    </Drawer>
  );
}
