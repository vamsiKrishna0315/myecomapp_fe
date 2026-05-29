'use client';

import React from "react";
import { useDispatch } from "react-redux";
import Link from "next/link";
import "./Product.css";
import { addProductToCart } from "../../redux/ProductReducer/action";
// import { Center } from "@chakra-ui/react";

const Product = ({item}) => {
  const dispatch = useDispatch();
  const { id, image,title,description,wet,price} = item || {};
  
  const addToCartFunction=() => {
    item && dispatch(addProductToCart(item));
  }
  
  if (!item || !id) {
    return null;
  }
  
  return (
    <div>
      <div className="product_first_div1" key={id}  >
      <Link href={`/chicken/${id}`}><img className="ProductImage" src={image} alt="abcd" />
        <h3 className="product_title1">{title}</h3>
        <p className="product_description_1">{description}</p>
        <div className="product_weight1">
          <p className="product_weight2">{wet}</p>
        </div>
        </Link>
        <div className="product_weight1">
          <h3 className="product_price1"> MRP:₹{price}</h3>
          <button className="product_add_cart1" onClick={addToCartFunction}>Add To Cart</button>
        </div>
      </div>
    </div>
  );
};
export default Product;