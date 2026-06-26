'use client';

import React, {useState,useEffect} from 'react';
import Total from "../Cart/Total";
import axios from "axios";
 

const Sum = () => {
  
  const [data, setData] = useState([]);

  useEffect(() => {
    async function getCartData(){
      const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
      const sep = base.endsWith("/") ? "" : "/";
      const url = `${base}${sep}api/v1/${apiType}/cart`;
      const token = (typeof window !== 'undefined') ? localStorage.getItem('Token') : null;
      let res = await axios.get(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
 
      const payload = res.data;
      const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setData(items);
    }
    getCartData()
  },[])

 const totalsum = (data) => {
    if (!Array.isArray(data)) return 0;
    return data.reduce((acc, c) => acc + (parseFloat(c.total_price || c.line_total || c.price || 0)), 0);
  };
  return (
    <div >
      <Total total={totalsum(data)} />
      
    </div>
  );
};


export default Sum;
