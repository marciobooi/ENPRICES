/*
Definition, mapping and handling of Eurobase codes
*/


/*
ALL ABOUT COUNTRY CODES
*/
// List of all countries found in the energy prices dataset !!! LOOKUP TABLE !!!
// Labels are set in the language JSON files in the data folder 
energyCountries = {
	"EU27_2020": "",
	// "EU28": "",
	"EA": "",
	"BE": "",
	"BG": "",
	"CZ": "",
	"DK": "",
	"DE": "",
	"EE": "",
	"IE": "",
	"EL": "",
	"ES": "",
	"FR": "",
	"HR": "",
	"IT": "",
	"CY": "",
	"LV": "",
	"LT": "",
	"LU": "",
	"HU": "",
	"MT": "",
	"NL": "",
	"AT": "",
	"PL": "",
	"PT": "",
	"RO": "",
	"SI": "",
	"SK": "",
	"FI": "",
	"SE": "",
	// "UK": "",
	"IS": "",
	"NO": "",
	"LI": "",
	"ME": "",
	"MK": "",
	"AL": "",
	"RS": "",
	"TR": "",
	"XK": "",
	"UA": "",
	"MD": "",
	"BA": "",
	"GE": "",


};

geocodes = {
	"European Union (27 countries)": "EU27_2020",
	"Austria": "AT",
	"Belgium": "BE",
	"Spain": "ES",
	"France": "FR",
	// "European Union (28 countries)": "EU28",
	"Euro area (19 countries)": "EA",
	"Belgium": "BE",
	"Bulgaria": "BG",
	"Czechia": "CZ",
	"Denmark": "DK",
	"Germany": "DE",
	"Estonia": "EE",
	"Ireland": "IE",
	"Greece": "EL",
	"Spain": "ES",
	"France": "FR",
	"Croatia": "HR",
	"Italy": "IT",
	"Cyprus": "CY",
	"Latvia": "LV",
	"Lithuania": "LT",
	"Luxembourg": "LU",
	"Hungary": "HU",
	"Malta": "MT",
	"Netherlands": "NL",
	"Austria": "AT",
	"Poland": "PL",
	"Portugal": "PT",
	"Romania": "RO",
	"Slovenia": "SI",
	"Slovakia": "SK",
	"Finland": "FI",
	"Sweden": "SE",
	// "United Kingdom": "UK",
	"Iceland": "IS",
	"Liechtenstein": "LI",
	"Norway": "NO",
	"Montenegro": "ME",
	"North Macedonia": "MK",
	"Serbia": "RS",
	"Türkiye": "TR",
	"Bosnia and Herzegovina": "BA",
	"Kosovo (UN SCR 1244/99)": "XK",
	"Moldova": "MD",
	"Ukraine": "UA",
	"Georgia": "GE",
	"Albania": "AL",

}


//uncomment the code below to add the new country color code to the "EU27_2019" graphic: "European Union (without United Kingdom)" 
barColors = {
	"EU27_2020": "#14375A",
	"EA": "#800000",
	"EU28": "#14375A"
};

// comment out the code below to remove the old country color code from the "EU28" chart: "European Union (28 countries)"
// barColors = { "EU28": "#14375A", "EA": "#800000" };

//energyCountryCodeList = ["EU28","EU27","EA","BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","LV","LT","LU","HU","NL","AT","PL","PT","RO","SI","SK","SE","UK","MK","MD","RS","TR","BA","UA","LI"];


/*
ALL ABOUT PRODUCT CODES
*/
energyProducts = {	
	
"4100": "",
"6000": "",};

/*
ALL ABOUT CONSUMER CODES
*/
energyConsumers = {
	"HOUSEHOLD": "",
	"N_HOUSEHOLD": ""
};

/*
ALL ABOUT CONSUMPTION LEVEL CODES
*/
energyBands = {
	"4141901": "","4141902": "","4141903": "","4161905": "",
	"TOT_GJ": "","GJ_LT20": "","GJ20-199": "","GJ_GE200": "",

	"4142901": "","4142902": "","4142903": "","4142904": "","4142905": "","4142906": "",
	"TOT_GJ": "", "GJ_LT1000": "", "GJ1000-9999": "", "GJ10000-99999": "", "GJ100000-999999": "", "GJ1000000-3999999": "", "GJ_GE4000000": "",

	"4161901": "","4161902": "","4161903": "","4161904": "","4161905": "",
	"TOT_KWH": "","KWH_LT1000": "","KWH1000-2499": "","KWH2500-4999": "","KWH5000-14999": "","KWH_LE15000": "",

	"4162901": "","4162902": "","4162903": "","4162904": "","4162905": "","4162906": "","4162907": "",
	"TOT_MWH": "", "MWH_LT20": "", "MWH20-499": "", "MWH500-1999": "", "MWH2000-19999": "", "MWH20000-69999": "", "MWH70000-149999": "", "MWH_GE150000": "",	
};

/*
ALL ABOUT UNIT CODES
*/
energyUnits = {
	"GJ_GCV": "",
	"KWH": "",
	"MWH": "",
};

/*
ALL ABOUT TAX CODES
*/
energyTaxs = {
	"X_TAX": "",
	"X_VAT": "",
	"I_TAX": "",
	"NRG_SUP": "",
	"NETC": "",
	"TAX_FEE_LEV_CHRG": "",
	"VAT": "",
	"TAX_RNW": "",
	"TAX_CAP": "",
	"TAX_ENV": "",
	"OTH": "",
	"TAX_NUC": "",
	"TAX_LEV_X_VAT": ""
};

/*
ALL ABOUT CURRENCY CODES
*/
energyCurrencies = {
	"EUR": "",
	"NAT": "",
	"PPS": ""
};

/*
ALL ABOUT BREAKDOWN CODES
*/
energyBreakdowns = {
	"DP_ES": "",
	"DP_NC": "",
	"DP_TL": ""
};

/*

/*
ALL ABOUT BAND CODES
*/
//define a generic list of 14 band colors to be used for the pie charts and time graphs


totalColors = ["#388AE2", "#06D7FF", "#19FF99", "#4C99FF"];

lineColors = ["#388AE2", "#06D7FF", "#19FF99", "#4C99FF"];

detailColors = ["#388AE2", "#06D7FF", "#19FF99"];

colors = {
	"TOTAL":'#388AE2',
	"NETC":'#06D7FF',
	"TAX_LEV_X_VAT":'#19FF99',
	"VAT":'#4C99FF',
	"TAX_RNW":'#FFD900',
	"TAX_CAP":'#C88000',
	"TAX_ENV":'#33D129',
	"TAX_NUC":'#FFB800',	
	"OTH":'#E67500',
	"NRG_SUP":'#05A0FF',
}

componentColors = [
	'#388AE2',
	'#06D7FF',
	'#19FF99',
	'#4C99FF',
	'#FFD900',
	'#C88000',
	'#33D129',
	'#FFB800',
	
	'#E67500',
	'#05A0FF',
	'#2CB523',
	'#8C4000',
	'#0033FF',
	'#00A68C',
	'#FF8C00',
	
	'#00D98C',
	'#2673FF',
	'#FFB300',
	'#FF8A00',
	'#B35900',
	'#26A31F',
	'#0573FF',
]








codesEnprices = {
	"geo": Object.keys(energyCountries),
	"product": Object.keys(energyProducts),
	"consom": Object.keys(energyBands),
	"unit": Object.keys(energyUnits),
	"tax": Object.keys(energyTaxs),
	"currency": Object.keys(energyCurrencies),
	"breakdown": Object.keys(energyBreakdowns),
	"fuel": totalColors,
	"year": [] // to be queried from Eurobase directly
};

codesDataset = {
	"nrg_pc_202_c": {
		"product": "4100",
		"consumer": "HOUSEHOLD",
		"consoms": ["TOT_GJ", "GJ_LT20", "GJ20-199", "GJ_GE200"],
		"unit": ["GJ_GCV", "KWH"],
		"currency": ["EUR", "PPS"],
		"nrg_prc": ["NETC", "NRG_SUP", "OTH", "TAX_CAP", "TAX_ENV", "TAX_RNW", "VAT"],
		"defaultConsom": "TOT_GJ",
		"defaultUnit": "KWH",		
		"defaultCurrency": "EUR"
	},
	"nrg_pc_202": {
		"product": "4100",
		"consumer": "HOUSEHOLD",
		"consoms": ["TOT_GJ", "GJ_LT20", "GJ20-199", "GJ_GE200"],
		"unit": ["GJ_GCV", "KWH", "MWH"],
		"currency": ["EUR", "PPS"],
		"defaultConsom": "GJ20-199",
		"defaultUnit": "KWH",
		"defaultCurrency": "EUR"
	},

	"nrg_pc_203_c": {
		"product": "4100",
		"consumer": "N_HOUSEHOLD",
		"consoms": ["TOT_GJ", "GJ_LT1000", "GJ1000-9999", "GJ10000-99999", "GJ100000-999999", "GJ1000000-3999999", "GJ_GE4000000"],
		"unit": ["GJ_GCV", "KWH"],
		"currency": ["EUR", "PPS"],
		"nrg_prc": ["NETC", "NRG_SUP", "OTH", "TAX_CAP", "TAX_ENV", "TAX_RNW", "VAT"],
		"defaultConsom": "TOT_GJ",
		"defaultUnit": "KWH",		
		"defaultCurrency": "EUR"
	},
	"nrg_pc_203": {
		"product": "4100",
		"consumer": "N_HOUSEHOLD",
		"consoms": ["TOT_GJ", "GJ_LT1000", "GJ1000-9999", "GJ10000-99999", "GJ100000-999999", "GJ1000000-3999999", "GJ_GE4000000"],
		"unit": ["GJ_GCV", "KWH", "MWH"],
		"currency": ["EUR", "PPS"],
		"defaultConsom": "GJ1000-9999",
		"defaultUnit": "KWH",
		"defaultCurrency": "EUR"
	},
	"nrg_pc_204_c": {
		"product": "6000",
		"consumer": "HOUSEHOLD",
		"consoms": ["TOT_KWH", "KWH_LT1000", "KWH1000-2499", "KWH2500-4999", "KWH5000-14999", "KWH_LE15000"],
		"unit": ["KWH", "MWH"],
		"currency": ["EUR", "PPS"],
		"nrg_prc": ["NETC", "NRG_SUP", "OTH", "TAX_CAP", "TAX_ENV", "TAX_NUC", "TAX_RNW", "VAT"],
		"defaultConsom": "TOT_KWH",
		"defaultUnit": "KWH",
		"defaultCurrency": "EUR"
	},
	"nrg_pc_204": {
		"product": "6000",
		"consumer": "HOUSEHOLD",
		"consoms": ["KWH_LT1000", "KWH_GE15000", "KWH5000-14999", "KWH2500-4999", "KWH1000-2499"],
		"unit": ["KWH", "MWH"],
		"currency": ["EUR", "PPS"],
		"defaultConsom": "KWH_LT1000",
		"defaultUnit": "KWH",
		"defaultCurrency": "EUR"
	},
	"nrg_pc_205_c": {
		"product": "6000",
		"consumer": "N_HOUSEHOLD",
		"consoms": ["TOT_MWH", "MWH_LT20", "MWH20-499", "MWH500-1999", "MWH2000-19999", "MWH20000-69999", "MWH70000-149999", "MWH_GE150000"],
		"unit": ["MWH"],
		"currency": ["EUR", "PPS"],
		"nrg_prc": ["NRG_SUP", "NETC", "TAX_LEV_X_VAT", "VAT", "TAX_RNW", "TAX_CAP", "TAX_ENV", "TAX_NUC", "OTH",],
		"defaultConsom": "TOT_MWH",
		"defaultUnit": "KWH",
		"defaultCurrency": "EUR"
	},

	"nrg_pc_205": {
		"product": "6000",
		"consumer": "N_HOUSEHOLD",
		"consoms": ["TOT_KWH", "MWH_LT20", "MWH20-499", "MWH500-1999", "MWH2000-19999", "MWH20000-69999", "MWH70000-149999", "MWH_GE150000"],
		"unit": ["KWH", "MWH"],
		"currency": ["EUR", "PPS"],		
		"defaultConsom": "MWH20-499",
		"defaultUnit": "KWH",
		"defaultCurrency": "EUR"
	},
};

// defGeos = ["all","EU27_2020","EA","BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","IS","LI","NO","ME","MK","AL","RS","TR","BA","XK","MD","UA","GE"]
defGeos = ["EU27_2020","EA","BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","IS","LI","NO","ME","MK","AL","RS","TR","BA","XK","MD","UA","GE"];




sortCountries = ["PROTO","ALPHA","ASC","DESC"]

