'use client';

import Link from "next/link";
import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import {AppContext} from "../Context/AppContext";
import { useCart } from "../Context/CartContext";
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Box,
  Flex,
  Text,
  Button,
  Center,
  Image,
  Spacer,
  useDisclosure
} from "@chakra-ui/react";
import MainPage from "../Cart/Mainpage";



const Bag_Drawer = ({ onClose, isOpen }) => {
     const {userData} = useContext(AppContext);
     const { cartCount, refreshCart } = useCart();
     let totalPrice=0;
  // const { onClose, isOpen, onOpen } = useDisclosure();
  const router = useRouter();
  // let totalPrice = 0;
  const goToAddressPage = () => {
    onClose();
    router.push("/address");
  }

  // Check if cart has items
  const hasItems = cartCount > 0;
  return (
    <>
      {/* <Button
        // ref={btnRef}
        onClick={onOpen}
        variant="ghost"
        color="black"
        _hover="none"
        fontWeight="400"
        // width="100px"
        fontSize={"14px"}
        colorScheme="gray"
        leftIcon={
        <Image color={"#000"} cursor="pointer"
         src='https://www.licious.in/img/rebranding/cart_icon.svg' 
         alt='cart'
        />}
      >
        Cart
      </Button> */}
      <Drawer size={['xs', 'xs', 'sm', 'sm']}
       placement={"right"} onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader fontSize={"24px"} color="black" 
          borderBottomWidth="1px">Order Summary</DrawerHeader>
          <Box border={"1px solid green"} height={"40px"} 
          width={"100%"} backgroundColor={"rgb(65,117,5)"}>
            <Center>
              <Text fontSize={"13px"} color={"white"} marginTop={"10px"}>
                Your cart value is less than ₹399 & delivery charge applies
              </Text>
            </Center>
          </Box>
          <DrawerBody>

            <Box>
              <MainPage isOpen={isOpen} />
            </Box>

            {/* <Box border={"1px solid black"} height={"56%"} overflowY={"scroll"}>
                {userData?.map((el) => (
                  <Box padding={"5px 10px"}>
                    <Flex gap={2}>
                      <Box h={"100px"} w={"250px"}>
                        <Image h={"100px"} w={"100%"} src={el.image}/>
                      </Box>
                      <Box>
                        <Text noOfLines={2}>{el.name}</Text>
                        <Text>Rs.{el.price}</Text>
                      </Box>
                    </Flex>
                    </Box>
                ))}
            </Box> */}



            
            <Box display={"flex"} justifyContent="flex-end" backgroundColor={"white"} >
              {hasItems ? (
                <Button
                  colorScheme={"green"}
                  borderRadius={"1%"}
                  w={"50%"}
                  bg="#7b7b7b"
                  color={"white"}
                  padding={"10px"}
                  onClick={() => {
                    onClose(); // Close the drawer
                    router.push('/checkout'); // Navigate to checkout
                  }}
                >
                  Proceed To Checkout
                </Button>
              ) : (
                <Button
                  colorScheme={"gray"}
                  borderRadius={"1%"}
                  w={"50%"}
                  bg="#cccccc"
                  color={"white"}
                  padding={"10px"}
                  isDisabled={true}
                  cursor="not-allowed"
                >
                  Cart is Empty
                </Button>
              )}
            </Box>

          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Bag_Drawer;
