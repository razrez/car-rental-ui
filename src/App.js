import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { ABI, ADDRESS } from "./contracts/contarctConfig";
import "./App.css";

function App() {
  const [web3, setWeb3] = useState();
  const [contract, setContract] = useState();
  const [cars, setCars] = useState([]);
  const [renter, setRenter] = useState();
  const [connected, setConnected] = useState(false);
  const [rentedCars, setRentedCars] = useState([]);

  const [rentalDuration, setRentalDuration] = useState(null);
  const [carId, setCarId] = useState(null);
  const [returnId, setReturnId] = useState(-1);
  
  const getCars = async () => {
    if (connected){
      const _cars = await contract.methods.getCars().call();
      setCars(_cars);

      setRentedCars();
      const _rentedCars = _cars.filter((car) => car.renter === renter);
      if(_rentedCars.length > 0) {
        setRentedCars(_rentedCars);
      }
    }
  };

  // инициализация и подключение кошелька (или обновление полей при смене аккаунта )
  useEffect(() => {
    const web3Instance = new Web3(window.ethereum);
    setWeb3(web3Instance);

    const contract = new web3Instance.eth.Contract(ABI, ADDRESS);
    setContract(contract);

    const checkConnected = async () => {
      const accounts = await web3Instance.eth.getAccounts();
      if (accounts.length > 0) {
        setRenter(accounts[0]);
        setConnected(true);

        const _cars = await contract.methods.getCars().call();
        setCars(_cars);
        console.log(_cars);

        const _rentedCars = _cars.filter((car) => car.renter === accounts[0]);
        if(_rentedCars.length > 0) {
          setRentedCars(_rentedCars);
        }
      }

    };
    checkConnected();
    
  }, [renter]);

  // обработка смены аккаунтов/провадера
  useEffect(() => {

    if (web3 && contract) {
      web3.currentProvider.on("accountsChanged", (accounts) => {
        setRenter(accounts[0]);
      });
    }
  }, [web3, contract]);


  const returnCar = async () => {
    if (!renter || !contract) return;

    try{
      await contract.methods.returnCar(returnId).send({ from: renter });
    }
    catch{
      alert("return session gone wrong");
    }

    getCars();
    setReturnId(-1);
  };

  const connectWallet = async () => {
    if (!web3) {
      alert("Please install MetaMask or connect to a local blockchain.");
      return;
    }
    const accounts = await web3.eth.requestAccounts();
    if (accounts.length === 0) {
      alert("Please connect to a wallet.");
      return;
    }
    setRenter(accounts[0]);
    setConnected(true);
  };

  const rentCarHandler = async () => {
    try{
      const ethersPrice = web3.utils.fromWei(cars[carId].dailyRentalRate, "ether") * rentalDuration
      const value = web3.utils.toWei(ethersPrice, "ether");

      await contract.methods.rentCar(carId, rentalDuration).send({ from: renter, value: value });
    }

    catch{
      alert("smth went wrong")
    }

    getCars();
    setCarId(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <Typography variant="h1">Car Rental</Typography>
        {!renter && (
          <>
            <Typography variant="h2">
              Please connect your wallet to continue
            </Typography>
            <Button onClick={connectWallet}>Connect Wallet</Button>
          </>
        )}

        {renter && (
          <>
            <Typography variant="h4">
              Renter: {renter}
            </Typography>
          </>
        )}

        {renter && connected && cars && (<FormControl>
          <InputLabel>AVAILABLE CARS</InputLabel>
          <Select
            value={carId}
            onChange={e => setCarId(e.target.value)}
          >
            {cars.map((car) => car.renter === "0x0000000000000000000000000000000000000000" &&
              <MenuItem key={car.id} value={car.id}>
                {car.make} {car.model}, {String(car.year)} - {web3.utils.fromWei(car.dailyRentalRate, "ether")}(ETH/day) 
              </MenuItem>
            )}
          </Select>

          <TextField
            label="Rental Duration"
            type="number"
            value={rentalDuration}
            onChange={e => setRentalDuration(e.target.value)}
          />

          <Button disabled={carId === null || rentalDuration <= 0} onClick={rentCarHandler}>RENT</Button>

        </FormControl>)}
        
        {renter && (<FormControl>
          <InputLabel>RENTED </InputLabel>
          <Select
            value={returnId}
            onChange={e => setReturnId(e.target.value)}
          >
            {rentedCars !== undefined && rentedCars.map((car) => car.renter === renter.toString() &&
              <MenuItem key={car.id} value={car.id}>
                {car.make} {car.model}, {String(car.year)} - {web3.utils.fromWei(car.dailyRentalRate, "ether")}(ETH/day) 
              </MenuItem>
            )}
          </Select>

          <Button disabled={returnId < 0} onClick={returnCar}>RETURN CAR</Button>

        </FormControl>)}
        

      </header>
  </div>
  )
}

export default App;