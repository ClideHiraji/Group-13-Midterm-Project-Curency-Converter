// ============================================================
// IMPORTS
// ============================================================
// Import helper module that maps currency codes to country flag codes
import { currencyToFlagCode } from './currency-to-flag-code.js'


// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
// Input field for source currency amount
const inputSourceCurrency = document.getElementById('inputSourceCurrency');

// All currency select dropdowns in the converter
const currencySelectElements = document.querySelectorAll('.currency-converter_select select');

// Source currency flag image and select dropdown
const imageSourceCurrency = document.getElementById('imageSourceCurrency');
const selectSourceCurrency = document.getElementById('selectSourceCurrency');

// Target currency flag image and select dropdown
const imageTargetCurrency = document.getElementById('imageTargetCurrency');
const selectTargetCurrency = document.getElementById('selectTargetCurrency');

// Swap button to reverse source and target currencies
const buttonSwap = document.getElementById('buttonSwap');

// Text element displaying the current exchange rate
const exchangeRateText = document.getElementById('exchangeRateText');

// Button to trigger currency conversion
const buttonConvert = document.getElementById('buttonConvert');


// ============================================================
// API CONFIGURATION
// ============================================================
// ExchangeRate-API key for fetching live conversion rates
const API_Key = 'b20b342878a7581b47213640';


// ============================================================
// STATE VARIABLES
// ============================================================
// Flag to track if exchange rate data has been successfully fetched
let isFetching = false;

// The current conversion rate between source and target currencies
let conversionRate = 0;

// Current value in the source currency input field
let sourceCurrentValue = 0;

// Calculated value in the target currency after conversion
let targetCurrentValue = 0;


// ============================================================
// EVENT LISTENER: SWAP CURRENCIES
// ============================================================
// Swap source and target currencies when the swap button is clicked
buttonSwap.addEventListener('click', () => {
    // Swap the selected currency values in both dropdowns
    [selectSourceCurrency.value, selectTargetCurrency.value] = [selectTargetCurrency.value, selectSourceCurrency.value];
    
    // Swap the country flag images
    [imageSourceCurrency.src, imageTargetCurrency.src] = [imageTargetCurrency.src, imageSourceCurrency.src];
    
    // Update input field with the previously calculated target value
    inputSourceCurrency.value = targetCurrentValue;

    // If exchange rate was already fetched, reverse the conversion rate
    if(isFetching){
        conversionRate = 1 / conversionRate;
    }
    
    // Update the displayed exchange rate with swapped values
    updateExchangeRate();
})


// ============================================================
// EVENT LISTENER: INPUT CHANGE
// ============================================================
// Update exchange rate dynamically as user types in the input field
inputSourceCurrency.addEventListener('input', event => {
    // Only update if data has been fetched and input is greater than 0
    if (isFetching && inputSourceCurrency.value > 0) {
        updateExchangeRate();
    }
    // If user clears the field, treat as zero and still update
    if (isFetching) {
        // coerce blank to "0"
        if (inputSourceCurrency.value === "") {
            inputSourceCurrency.value = "";
        }
        updateExchangeRate();
    }
})


// ============================================================
// MAIN CONVERSION FUNCTION
// ============================================================
/**
 * Fetches the latest exchange rate from the API and updates the display
 * Validates input, makes API call, and handles errors
 */
async function handleConvert() {
    // Validate that the input amount is greater than 0
    if (inputSourceCurrency.value <= 0) {
        alert('Please enter a valid amount.');
        return; // Exit function if validation fails
    }

    // Check if user is offline before fetching
    if (!navigator.onLine) {
        alert('You are offline. Please check your internet connection.');
        exchangeRateText.textContent = 'No internet connection!';
        return;
    }
    
    // Display loading message while fetching
    exchangeRateText.textContent = 'Fetching exchange rate, please wait...';

    // Get the current selected currency codes
    const selectSourceCurrencyValue = selectSourceCurrency.value;
    const selectTargetCurrencyValue = selectTargetCurrency.value;
    
    try {
        // Fetch exchange rate from ExchangeRate-API
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_Key}/pair/${selectSourceCurrencyValue}/${selectTargetCurrencyValue}`);
        
        // Parse JSON response
        const data = await response.json();
        
        // Store the conversion rate from API response
        conversionRate = data.conversion_rate;

        // Mark that data has been successfully fetched
        isFetching = true;
        
        // Update the displayed exchange rate with fetched data
        updateExchangeRate();
    } catch (error) {
        // Handle fetch errors for network issues
        if (!navigator.onLine) {
            //Display no connection message in ui
            exchangeRateText.textContent = 'No internet connection!';
         } else {
            // Display user-friendly error message
            exchangeRateText.textContent = 'Error fetching exchange rate!';
        }
        // Log error to console for debugging
        console.log('Error fetching exchange rate!', error);
    }
}


// ============================================================
// EVENT LISTENERS: TRIGGER CONVERSION
// ============================================================
// Listen for convert button click
buttonConvert.addEventListener('click', handleConvert);

// Listen for "Enter" key press on the input field to trigger conversion
inputSourceCurrency.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        handleConvert();
    }
});


// ============================================================
// UPDATE EXCHANGE RATE DISPLAY
// ============================================================
/**
 * Calculates and displays the converted currency amount
 * Shows formatted exchange rate text with both source and target values
 */
function updateExchangeRate() {
    // Parse the current input value as a floating-point number
    sourceCurrentValue = parseFloat(inputSourceCurrency.value) || 0;

    // Calculate target currency value and round to 2 decimal places
    targetCurrentValue = (sourceCurrentValue * conversionRate).toFixed(2);

    // Display formatted conversion result
    exchangeRateText.textContent = `${formatCurrency(sourceCurrentValue)} ${selectSourceCurrency.value} 
    = ${formatCurrency(targetCurrentValue)} ${selectTargetCurrency.value}`
}


// ============================================================
// INITIALIZE CURRENCY SELECT DROPDOWNS
// ============================================================
/**
 * Populate all select dropdowns with available currencies
 * Set default values and attach event listeners
 */
currencySelectElements.forEach(selectElement => {
    // Loop through all available currencies and create option elements
    for (const [currency, flagCode] of Object.entries(currencyToFlagCode)) {
        const newOptionElement = document.createElement('option');
        newOptionElement.value = currency; // Currency code (e.g., "USD")
        newOptionElement.textContent = flagCode.name; // Currency name
        selectElement.appendChild(newOptionElement);
    }
    
    // Listen for changes in the select dropdown
    selectElement.addEventListener('change', () => {
        // Reset input field to 0
        inputSourceCurrency.value = 0;
        
        // Reset fetching flag since currency changed
        isFetching = false;
        
        // Update the exchange rate display
        updateExchangeRate();
        
        // Update the corresponding country flag
        changeFlag(selectElement);
    });
    
    // Set default value for source currency dropdown to USD
    if (selectElement.id === 'selectSourceCurrency') {
        selectElement.value = 'USD';  
    }
    
    // Set default value for target currency dropdown to PHP
    if (selectElement.id === 'selectTargetCurrency') {
        selectElement.value = 'PHP';  
    }
})


// ============================================================
// UPDATE COUNTRY FLAG IMAGES
// ============================================================
/**
 * Changes the flag image based on selected currency
 * @param {HTMLSelectElement} selectElement - The select dropdown that changed
 */
function changeFlag(selectElement) {
    // Get the selected currency code
    const selectValue = selectElement.value;
    
    // Get the ID of the select element to determine which flag to update
    const selectId = selectElement.id;
    
    // Get flag data for the selected currency
    const flagData = currencyToFlagCode[selectValue];

    // Exit if no flag data exists for this currency
    if (!flagData) return; 

    // Update the appropriate flag image based on which select changed
    if (selectId === 'selectSourceCurrency') {
        // Update source currency flag using flagcdn.com API
        imageSourceCurrency.src = `https://flagcdn.com/w640/${flagData.flag}.png`;
    } else {
        // Update target currency flag using flagcdn.com API
        imageTargetCurrency.src = `https://flagcdn.com/w640/${flagData.flag}.png`;
    }
}


// ============================================================
// UTILITY FUNCTION: FORMAT CURRENCY
// ============================================================
/**
 * Formats a number with thousands separators for better readability
 * @param {number} number - The number to format
 * @returns {string} - Formatted number string (e.g., "1,234.56")
 */
function formatCurrency(number) {
    return new Intl.NumberFormat().format(number);
}
