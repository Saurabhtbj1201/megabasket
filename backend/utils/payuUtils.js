const crypto = require('crypto');

const PAYU_CONFIG = {
    MERCHANT_KEY: process.env.PAYU_MERCHANT_KEY || 'YjppYG',
    SALT: process.env.PAYU_SALT || 'eWC8LTwTwk09Zifd9FoObWvg7X5oPVr8',
    BASE_URL: process.env.NODE_ENV === 'production' 
        ? 'https://secure.payu.in/_payment' 
        : 'https://test.payu.in/_payment'
};

const generateHash = (params) => {
    const { key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5 } = params;
    
    // Ensure all values are strings and handle empty values properly
    const keyStr = String(key || '');
    const txnidStr = String(txnid || '');
    const amountStr = String(amount || '0');
    const productinfoStr = String(productinfo || '');
    const firstnameStr = String(firstname || '');
    const emailStr = String(email || '');
    const udf1Str = String(udf1 || '');
    const udf2Str = String(udf2 || '');
    const udf3Str = String(udf3 || '');
    const udf4Str = String(udf4 || '');
    const udf5Str = String(udf5 || '');
    
    // PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    // Note: The 6 empty pipes represent optional fields that we're not using
    const hashString = `${keyStr}|${txnidStr}|${amountStr}|${productinfoStr}|${firstnameStr}|${emailStr}|${udf1Str}|${udf2Str}|${udf3Str}|${udf4Str}|${udf5Str}||||||${PAYU_CONFIG.SALT}`;
    
    console.log('Hash String for generation:', hashString);
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    console.log('Generated Hash:', hash);
    return hash;
};

const verifyPayment = (params) => {
    const { key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, status, hash } = params;
    
    // Ensure all values are strings
    const keyStr = String(key || '');
    const txnidStr = String(txnid || '');
    const amountStr = String(amount || '0');
    const productinfoStr = String(productinfo || '');
    const firstnameStr = String(firstname || '');
    const emailStr = String(email || '');
    const udf1Str = String(udf1 || '');
    const udf2Str = String(udf2 || '');
    const udf3Str = String(udf3 || '');
    const udf4Str = String(udf4 || '');
    const udf5Str = String(udf5 || '');
    const statusStr = String(status || '');
    
    // PayU verification hash format: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const hashString = `${PAYU_CONFIG.SALT}|${statusStr}||||||${udf5Str}|${udf4Str}|${udf3Str}|${udf2Str}|${udf1Str}|${emailStr}|${firstnameStr}|${productinfoStr}|${amountStr}|${txnidStr}|${keyStr}`;
    
    console.log('Hash String for verification:', hashString);
    const generatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    console.log('Generated Hash:', generatedHash);
    console.log('Received Hash:', hash);
    return generatedHash === hash;
};

const generateTxnId = () => {
    return 'MB' + Date.now();
};

module.exports = {
    PAYU_CONFIG,
    generateHash,
    verifyPayment,
    generateTxnId
};
