'use client';

import {
    Box,
    Container,
    Stack,
    Text,
    Image,
    Flex,
    VStack,
    Button,
    Heading,
    SimpleGrid,
    StackDivider,
    useColorModeValue,
    List,
    ListItem,
    Divider,
    Select,
    Spinner,
    useToast,
  } from "@chakra-ui/react";
  import source_image from "./source_image.jpg";
  import delhivery_image from "./delhivery_image.jpg";
  import React, { useEffect, useState } from "react";
  import { useDispatch, useSelector } from "react-redux";
  import { addProductToCart, getProducts } from "../../redux/ProductReducer/action";
  import unitConversionService from "../../utils/unitConversion";

  export default function ProductDetails({ params }) {
    const dispatch = useDispatch();
    const toast = useToast();
    const id = params?.id;
    const [currentProduct, setCurrentProduct] = useState({});
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [displayPrice, setDisplayPrice] = useState(0);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const chicken = useSelector((state) => state.reducer.chicken);
  
    // Fetch product from API
    useEffect(() => {
      if (id) {
        fetchProductDetails(id);
      }
    }, [id]);

    const fetchProductDetails = async (productId) => {
      try {
        setLoading(true);
        const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
        const sep = base.endsWith("/") ? "" : "/";
        const url = `${base}${sep}api/v1/${apiType}/products/${productId}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = await response.json();
        const product = data?.data || data;

        setCurrentProduct(product);

        // Set initial unit to base_price_unit or first allowed unit
        const initialUnit = product.base_price_unit ||
          (Array.isArray(product.allowed_units) && product.allowed_units[0]) ||
          'kg';
        setSelectedUnit(initialUnit);

        // Calculate initial display price
        calculateAndSetPrice(product, initialUnit);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product details",
          status: "error",
          duration: 3,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    const calculateAndSetPrice = (product, unit) => {
      try {
        const basePrice = parseFloat(product.price || 0);
        const baseUnit = product.base_price_unit;
        const gramsPerPiece = product.grams_per_piece != null ? parseFloat(product.grams_per_piece) : null;

        let price = basePrice;

        // If the unit is different from base_price_unit, convert the price using canonical service
        if (unit && baseUnit && unit !== baseUnit) {
          price = unitConversionService.calculatePrice(basePrice, String(baseUnit), String(unit), gramsPerPiece);
        }

        setDisplayPrice(parseFloat(Number(price).toFixed(2)));
      } catch (error) {
        console.error("Error calculating price:", error);
        setDisplayPrice(parseFloat(product.price || 0));
      }
    };

    const handleUnitChange = (e) => {
      const newUnit = e.target.value;
      setSelectedUnit(newUnit);
      calculateAndSetPrice(currentProduct, newUnit);
    };

    const addToCartFunction = async () => {
      try {
        if (!currentProduct.id) {
          toast({
            title: "Error",
            description: "Product information missing",
            status: "error",
            duration: 3,
            isClosable: true,
          });
          return;
        }

        setAddingToCart(true);

        // Get customer_id from localStorage or state
        const token = typeof window !== 'undefined' ? localStorage.getItem('Token') : null;
        const customer_id = typeof window !== 'undefined' ? localStorage.getItem('customer_id') : null;

        const cartItem = {
          product_id: currentProduct.id,
          customer_id: customer_id ? Number(customer_id) : null,
          quantity: 1,
          quantity_unit: selectedUnit,
          product_cut_id: currentProduct.product_cut_id || null,
        };

        await dispatch(addProductToCart(cartItem));

        toast({
          title: "Success",
          description: `Added to cart (${selectedUnit})`,
          status: "success",
          duration: 3,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast({
          title: "Error",
          description: "Failed to add to cart",
          status: "error",
          duration: 3,
          isClosable: true,
        });
      } finally {
        setAddingToCart(false);
      }
    };

    if (loading) {
      return (
        <Container maxW={"7xl"} mt="2rem">
          <Flex justifyContent="center" alignItems="center" h="400px">
            <Spinner size="lg" />
          </Flex>
        </Container>
      );
    }

    const allowedUnits = Array.isArray(currentProduct.allowed_units)
      ? currentProduct.allowed_units
      : ['kg'];

    return (
      <Container maxW={"7xl"} mt="2rem" boxShadow={" rgba(0, 0, 0, 0.1) 0px 10px 50px"}>
        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          spacing={{ base: 8, md: 10 }}
          py={{ base: 18, md: 24 }}
          borderRadius="5px"
        >
          <Flex>
            <Image
              rounded={"md"}
              alt={"product image"}
              src={currentProduct.image}
              fit={"contain"}
              align={"center"}
              w={"100%"}            
              h={{ base: "100%", sm: "400px", lg: "500px" }}
              boxShadow={"rgba(0, 0, 0, 0.15) 0px 5px 15px 0px"}
            />
          </Flex>
          <Stack spacing={{ base: 6, md: 10 }} alignItems="left">
            <Box as={"header"} >
              <Heading
                lineHeight={1.1}
                fontWeight={500}
                textAlign="left"
                fontSize={{ base: "2xl", sm: "4xl", lg: "2xl" }}              
              >
                {currentProduct.title}
              </Heading>
              <Text
                color={useColorModeValue("gray.900", "gray.400")}
                fontWeight={300}
                fontSize={"md"}
                textAlign="left"
              >
                {currentProduct.category}
              </Text>
              <Divider color="black" />
            </Box>
  
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={"column"}
              divider={
                <StackDivider
                  borderColor={useColorModeValue("gray.200", "gray.600")}
                />
              }
            >
              <VStack spacing={{ base: 4, sm: 6 }} textAlign="left" >
                <Text                  
                  color={useColorModeValue("gray.500", "gray.400")}
                >
                  Keep your chopping board aside, our special nakhras have curated special cuts of chicken for 
                  Chicken Popcorn, Garlic Chicken Bites, Chicken Nuggets and more!
                </Text>
                <Text
                  fontSize={"md"}
                  color={useColorModeValue("gray.500", "gray.400")}
                >
                  Our Chicken Mini Bites (Boneless) is made by cutting fresh boneless chicken into bite-sized pieces. 
                  You can use them to whip up easy toppings for your pizzas, salads, pastas, the possibilities are endless.
                </Text>
                <Text
                  fontSize={"md"}
                  color={useColorModeValue("gray.500", "gray.400")}
                >
                  Licious chickens are raised on biosecure farms and are antibiotic residue-free. They are cut and 
                  cleaned by experts so you can cook them straight off the pack.Our fresh chicken cuts are stored in 
                  temperature-controlled conditions, between 0-4?, to ensure that it is chilled, never frozen.
                </Text>
                <Text
                  fontSize={"md"}
                  color={useColorModeValue("gray.500", "gray.400")}
                >
                  Order Licious Chicken Mini Bites (Boneless) online and get it home delivered.
                </Text>
              </VStack>
              <Box
                border="1px solid grey"
                height="100px"
                borderRadius={"5px"}
                padding="20px"
              >
                <Flex justifyContent={"space-between"}>
                    <div className="picess_class22">
                        <Image className="piecess_image111" src="https://d2407na1z3fc0t.cloudfront.net/Banner/Pieces.png" alt="pices_image11" />
                        <Text>No. of Pieces: {currentProduct.pieces_per_pack || "14-16"}</Text>
                    </div>

                    <div className="picess_class22">
                        <Image className="piecess_image111" src="https://d2407na1z3fc0t.cloudfront.net/Banner/Serves.png" alt="serve_image11" />
                        <Text>Serve {currentProduct.serves || "4"}</Text>
                    </div>

                </Flex>
                <Divider margin={"5px"} />
                <Flex justifyContent={"space-between"}>
                  <div className="picess_class22">
                      <Image className="piecess_image111" src="https://d2407na1z3fc0t.cloudfront.net/Banner/Netwt.png" alt="grams_image11" />
                      <Text>{currentProduct.weight_in_grams || "526"}g</Text>
                  </div>
                </Flex>
              </Box>

              {/* Dynamic Unit Selector */}
              {allowedUnits.length > 1 && (
                <Box>
                  <Text fontWeight="600" mb="8px">
                    Select Unit:
                  </Text>
                  <Select
                    value={selectedUnit}
                    onChange={handleUnitChange}
                    width="100%"
                    borderColor="#D11243"
                    focusBorderColor="#D11243"
                  >
                    {allowedUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unitConversionService.getUnitLabel(unit)}
                      </option>
                    ))}
                  </Select>
                </Box>
              )}

              <Box>
                <Flex justifyContent={"space-between"}>
                  <Text
                    color="#d11243"
                    fontWeight={700}
                    fontSize={"30px"}
                  >
                    ₹{displayPrice}
                  </Text>
                  <Button
                    fontSize= {"11px"}
                    textTransform= {"uppercase"}
                    color= {"#fff"}
                    border= {"none"}
                    cursor= {"pointer"}
                    fontWeight= {"600"}
                    borderRadius= {"5px"}
                    backgroundColor= {"#D11243"}
                    height= {"36px"}
                    width= {"100px"}
                    onClick={addToCartFunction}
                    isLoading={addingToCart}
                    _hover={{ backgroundColor: "#b00d38" }}
                  >
                    {addingToCart ? "Adding..." : "Add to cart"}
                  </Button>
                </Flex>
              </Box>
              <Box>
                <Flex justifyContent={"space-between"}>
                  <Text color="#d11243"> Only the Safest Chicken!</Text>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent={"left"}
                  >
                    <div className="picess_class22">
                      <Image className="piecess_image111" src="https://www.licious.in/img/rebranding/express_delivery.svg" alt="delivery_image11" />
                    <Text>Today in 90 min</Text>
                  </div>
                  </Stack>
                </Flex>
              </Box>
            </Stack>
          </Stack>
        </SimpleGrid>
        <Image
          src={source_image}
          alt="Dan Abramov"
          size="full"
          mt="-50px"
          boxShadow={"rgba(0, 0, 0, 0.15) 0px 5px 15px 0px"}
        />
        <Image
          src={delhivery_image}
          alt="Dan Abramov"
          size="full"
          mt="20px"
          boxShadow={"rgba(0, 0, 0, 0.15) 0px 5px 15px 0px"}
          marginBottom={"50px"}
        />
      </Container>
    );
  }
  
  