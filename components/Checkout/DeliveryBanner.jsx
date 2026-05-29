'use client';

import React from 'react';
import { Box, Text, Flex, Spinner } from '@chakra-ui/react';

const DeliveryBanner = ({ deliveryTime, loading = false, visible = false }) => {
  if (!visible || !deliveryTime) {
    return null;
  }

  return (
    <Box
      w="full"
      bg="white"
      p={4}
      borderBottom="2px solid"
      borderColor="red.500"
      mb={6}
    >
      <Flex align="center">
        {loading && <Spinner size="xs" mr={2} />}
        <Text fontSize="md" color="gray.700">
          Your items will be delivered in
        </Text>
        <Box
          minW="56px"
          h="56px"
          px={3}
          mx={3}
          borderRadius="12px"
          bg="red.500"
          color="white"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          fontWeight="800"
          fontSize="2xl"
          lineHeight="1"
          flexShrink={0}
        >
          {deliveryTime}
        </Box>
        <Text fontSize="md" color="gray.700">
          minutes
        </Text>
      </Flex>
    </Box>
  );
};

export default DeliveryBanner;
