var SRC = '2016-02-08 15:57:15.9769 | Request parameters: instanceKey = 595cf45d-a236-40b2-a5df-4c82a41b46fe; ps = rbkmoney; eshopId = 2032429; paymentId = 2092991895; eshopAccount = RU801672422; recipientAmount = 2660.00; recipientCurrency = RUR; paymentStatus = 3; userName = ponomarev.evgeny@mail.ru; userEmail = ponomarev.evgeny@mail.ru; paymentData = 2016-02-07 21:05:26; orderId = 408722; serviceName = Payment Order ORD-0000001031 _payment 408722, user ponomarev.evgeny@mail.ru, account 550055_; hash = df1d3d8f531faf417b0e9491a2f474ef; userField_0 = ORD-0000001031; userField_1 = 550055; invoiceId = 1089331559; payerAccount = RU960130103; paymentAmount = 2660.00; paymentCurrency = RUR; rupay_payment_sum = 2660.00; rupay_payment_currency = RUR; merchantPaymentAmount = 2556.26; ';

function encodeURL(base, decoded) {
	if(decoded == '') {
		throw 'Исходная строка с данными не должна быть пустой';
	}

	var paramsArr = parseParamsToArray(decoded);
	var result = base + '?' + paramsArr.join('&');

	return result;
}

function parseParamsToArray(src) {
	// var result = [
	// 	'first=111',
	// 	'second=222'
	// ]

	var parts = src.split(';');

	var res = [ processFirstPair(parts[0]) ];
	for (var i = 1; i < parts.length; i++) {
		trimmed = parts[i].replace(/\s/g, '');
		if(trimmed == '') continue;
		res.push(trimmed);
	};
	// console.log(res);
	// console.log(processFirstPair(parts[0]));

	return res;
}

function processFirstPair(pair) {
	var arr = pair.split(' = ');
	if(arr.length != 2) {
		throw 'Ошибка разбора первого параметра';
	}

	var firstArr = arr[0].split(' ');
	if(firstArr.length < 2) {
		throw 'Ошибка разбора первого параметра';
	}

	var res = firstArr[firstArr.length-1] + '=' + arr[1];
	var trimmed = res.replace(/\s/g, '');
	return trimmed;
}

//console.log(
//	encodeURL('http://google.com', SRC)
//);