import * as types from "./actionTypes";
import axios from "axios";

const getProducts =(id, params)=>(dispatch  )=>{
  dispatch({type : types.GET_PRODUCTS_REQUEST})

  axios.get(`https://licious-api-data.vercel.app/${id}`,params)
  .then((abcd) =>dispatch({type : types.GET_PRODUCTS_SUCCESS ,payload : abcd.data}))
  .catch((error)=>dispatch({type : types.GET_PRODUCTS_fAILURE}))   
}
const addProductCartRequest = (payload) => {
  return {
    type: types.ADD_PRODUCT_CART_REQUEST,
    payload,
  };
};
const addProductCartSuccess = (payload) => {
  return {
    type: types.ADD_PRODUCT_CART_SUCCESS,
    payload,
  };
};
const addProductCartFailure = (payload) => {
  return {
    type: types.ADD_PRODUCT_CART_FAILURE,
    payload,
  };
};
const addProductToCart = (payload) => (dispatch) => {
  dispatch(addProductCartRequest());
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
  const sep = base.endsWith("/") ? "" : "/";
  const url = `${base}${sep}api/v1/${apiType}/cart`;
  const token = (typeof window !== 'undefined') ? localStorage.getItem('Token') : null;
  const body = {
    customer_id: Number(payload.customer_id),
    product_id: Number(payload.product_id),
    ...(payload.product_cut_id ? { product_cut_id: Number(payload.product_cut_id) } : {}),
    ...(payload.quantity ? { quantity: Number(payload.quantity) } : {}),
    ...(payload.quantity_unit ? { quantity_unit: String(payload.quantity_unit) } : {}),
    ...(payload.unit ? { unit: String(payload.unit) } : {}),
    ...(payload.price_per_unit != null ? { price_per_unit: Number(payload.price_per_unit) } : {}),
    ...(payload.total != null ? { total: Number(payload.total) } : {}),
  };
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  return axios
    .post(url, body, config)
    .then((abcd) => {
      dispatch(addProductCartSuccess(abcd.data));
      return abcd.data;
    })
    .catch((error) => {
      dispatch(addProductCartFailure(error?.response?.data || error));
      throw error;
    });
};
export { addProductToCart, getProducts };