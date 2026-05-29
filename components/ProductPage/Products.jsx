'use client';

import React, { useState } from "react";
import "./Product.css";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts } from "../../redux/ProductReducer/action";
import Product from "./Product";
import Chickenfilter from "./Chickenfilter";

const Products = () => { 
  const chicken = useSelector((state) => state.reducer.chicken);
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (chicken.length === 0) {    
      const categoryParams = searchParams.getAll("category");
      const getProductssParams = {
        params: {
          category: categoryParams     
        },
      };
      dispatch(getProducts("chicken",getProductssParams));
    }
  }, [searchParams]);
  
  return (
    <div  >
      <div className="allProduct1">
        <h1 className="allTagh1">Chicken</h1>
        <Chickenfilter />
      </div>
      <div className="allProduct11">
        {chicken.map((item) => {
          return (
            <div key={item.id}>          
              <Product item={item}/>          
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Products;