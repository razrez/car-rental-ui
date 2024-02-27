pragma solidity ^0.8.0;

contract CarRental {
    struct Car {
        uint id;
        string make;
        string model;
        uint year;
        uint dailyRentalRate;
        address renter;
        uint rentalStart;
        uint rentalEnd;
    }
    
    Car[] internal cars;
    uint public nextCarId = 0; // сколько всего машин

    event CarRented(uint id, address renter, uint rentalStart, uint rentalEnd);
    constructor () {
        cars.push(Car(nextCarId++, "Toyota", "Corolla", 2020, 0.02 * 10 ** 18, address(0), 0, 0));
        cars.push(Car(nextCarId++, "Honda", "Civic", 2019, 0.01 * 10 ** 18, address(0), 0, 0));
    }

    function getCar(uint _id) public view returns (uint, string memory, string memory, uint, uint, address, uint, uint) {
        Car memory car = cars[_id];
        return (car.id, car.make, car.model, car.year, car.dailyRentalRate, car.renter, car.rentalStart, car.rentalEnd);
    }

    function getCars() public view returns (Car[] memory) {
        return cars;
    }

    function rentCar(uint _id, uint _rentalDuration) public payable {
        Car storage car = cars[_id];

        require(msg.value >= car.dailyRentalRate * _rentalDuration, "Insufficient Ether sent");
        require(car.id == _id, "Car not found");
        require(car.renter == address(0), "Car already rented");
        

        car.renter = msg.sender;
        car.rentalStart = block.timestamp;
        car.rentalEnd = block.timestamp + _rentalDuration * 1 days;

        emit CarRented(_id, msg.sender, block.timestamp, car.rentalEnd);
    }

    function returnCar(uint _id) public {
        Car storage car = cars[_id];
        require(car.id == _id, "Car not found");
        require(car.renter == msg.sender, "Not the renter of this car");
        require(block.timestamp <= car.rentalEnd, "Car already returned");

        car.renter = address(0);
        car.rentalStart = 0;
        car.rentalEnd = 0;

        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }
}