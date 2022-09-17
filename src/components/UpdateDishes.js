import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Variables from './Variables';
import DishUpdate from './DishUpdate';
import changeScreen from "./Action";
import { Link, useParams } from "react-router-dom";
import axios from 'axios';
import CustomError from './CustomError';

const UpdateDishes = () => {

    const [data, setData] = useState([]);
    const [load, setLoad] = useState();

    const { id } = useParams();
    const splitedIds = id.split(/[-]/);

    const getData = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setData(false)
        } else {
            axios.post(`${Variables.hostId}/${splitedIds[0]}/dishlodge`, {
                headers: {
                    "x-access-token": localStorage.getItem("token"),
                }
            })
                .then(res => {
                    if(res.data.success){
                        setData(res.data.message)
                    } else {
                        localStorage.clear();
                        changeScreen();
                    }
                })
        }
    }


    useEffect(() => {
        getData()
    }, [load])

    return (
        <div>
            {
                data ? (
                    <div>
                        <Navbar id={id} name={splitedIds[1]} />
                        <div className="text-center">
                            <div>
                                <h3 className='heading-top topic-off'>
                                    Update Dish Data!
                                </h3>
                            </div>
                        </div>
                        <div className="grid-system">
                            <div className="container">
                                <div className='row'>
                                    {
                                        data.map((item, key) => {
                                            return (
                                                <DishUpdate dishname={item.dishName} dishrate={item.dishRate} dishtype={item.dishType} engaged={item.available} id={id} dishid={item._id} setLoad={setLoad} />
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <CustomError />
                    </div>
                )
            }
        </div>
    )
}

export default UpdateDishes