car-rental-platform ...
TEST 123


Meta Pixel Event List :
    (CompleteRegistration, 
            {method:signin || method:signup})

    (CarFilters,
            { 
              selectedMake: selectedMake, 
              selectedModel: selectedModel, 
              selectedCategory: selectedCategory, 
              selectedMinPrice: selectedMinPrice, 
              selectedMaxPrice: selectedMaxPrice 
            })

    (CarViewDetail,
            {
                carMake:car.make,
                carModel:car.model,
                carYear:car.year
            })
    
    (SearchCars,
        { 
            pickupDate: searchParams.pickupDate, 
            returnDate: searchParams.returnDate,
            pickupLocation: searchParams.pickupLocation, 
            returnLocation: searchParams.returnLocation 
        })
    
    (SocialMediaClick,{
        platform: socialMediaName
    })

    (NavbarClick, {
        label:linkName
    })