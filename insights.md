ENPRICES INSIGHTS: PRODUCT STRUCTURE, CALCULATION FORMULAS, DATA REQUIREMENTS, AND INTERPRETATION RULES
Version: Concept specification
Scope: Eurostat Energy Prices visualisation (Enprices)

===============================================================================
1. PURPOSE
===============================================================================

Enprices Insights should help users understand:

1. What is the selected energy price now?
2. How has it changed over time?
3. How does it compare with the EU, euro area, and other countries?
4. Which price components make up the final price?
5. Which components account for the observed price movement?
6. How does the price differ across consumption bands?
7. Does the interpretation change when prices are expressed in PPS?
8. Is the current value historically unusual?
9. Are prices across countries converging or diverging?
10. What data limitations or methodological qualifications apply?

The intended narrative order is:

PRICE -> MOVEMENT -> COMPARISON -> COMPOSITION -> CHANGE DRIVERS
-> CONSUMPTION PROFILE -> PPS PERSPECTIVE -> HISTORICAL CONTEXT
-> RELATED CONTEXT -> DATA QUALITY

The insights must be descriptive and statistically careful. A higher or lower energy
price must not automatically be classified as good, bad, favourable, or unfavourable.
Price levels can reflect wholesale conditions, network costs, taxes, support measures,
market structure, regulation, geography, energy mix, and other factors.

===============================================================================
2. AVAILABLE ENPRICES DIMENSIONS AND CODE FAMILIES
===============================================================================

The insight engine can use the dimensions already available in the tool.

2.1 Geography

Primary codes include:

- EU27_2020: European Union aggregate
- EA: Euro-area aggregate
- EU Member States
- EFTA and other reporting European countries

Country aggregates must not be included in ordinary country ranks unless the UI
explicitly presents an aggregate-inclusive comparison. Normally:

- Include individual reporting countries in country rankings.
- Display EU27_2020 and EA as benchmarks.
- Do not rank EU27_2020 or EA as if they were countries.

Relevant application structures:

- energyCountries
- geocodes
- defGeos
- barColors

2.2 Product

- 4100: Natural gas
- 6000: Electricity

Relevant application structure:

- energyProducts

2.3 Consumer type

- HOUSEHOLD
- N_HOUSEHOLD

Relevant application structure:

- energyConsumers

Household and non-household comparisons require qualification because the applicable
bands and tax treatments may differ.

2.4 Consumption band

Gas household examples:

- TOT_GJ
- GJ_LT20
- GJ20-199
- GJ_GE200

Gas non-household examples:

- TOT_GJ
- GJ_LT1000
- GJ1000-9999
- GJ10000-99999
- GJ100000-999999
- GJ1000000-3999999
- GJ_GE4000000

Electricity household examples:

- TOT_KWH
- KWH_LT1000
- KWH1000-2499
- KWH2500-4999
- KWH5000-14999
- KWH_GE15000 or the corresponding code used by the live dataset

Electricity non-household examples:

- TOT_MWH
- MWH_LT20
- MWH20-499
- MWH500-1999
- MWH2000-19999
- MWH20000-69999
- MWH70000-149999
- MWH_GE150000

Relevant application structures:

- energyBands
- codesDataset[dataset].consoms
- codesDataset[dataset].defaultConsom

Implementation note:
The supplied configuration contains possible naming inconsistencies such as
KWH_LE15000 versus KWH_GE15000 and TOT_KWH versus TOT_MWH in some dataset settings.
The insight layer should use the actual live dataset codes and a canonical mapping
rather than infer band order from the code text alone.

2.5 Unit

- GJ_GCV
- KWH
- MWH

Relevant application structures:

- energyUnits
- codesDataset[dataset].unit
- codesDataset[dataset].defaultUnit

All arithmetic comparisons require compatible units. Convert values before comparing
only when an approved conversion rule exists. The converted unit must be displayed.

2.6 Currency or price expression

- EUR
- NAT
- PPS

Relevant application structures:

- energyCurrencies
- codesDataset[dataset].currency
- codesDataset[dataset].defaultCurrency

EUR, national currency, and PPS must not be mixed in one arithmetic comparison unless
the insight explicitly compares the positions produced by different expressions.

2.7 Tax and component codes

Broad price treatments or totals:

- X_TAX
- X_VAT
- I_TAX

Main components:

- NRG_SUP: Energy and supply
- NETC: Network costs
- TAX_FEE_LEV_CHRG: Taxes, fees, levies, and charges
- TAX_LEV_X_VAT: Taxes and levies excluding VAT
- VAT: Value added tax
- OTH: Other components

Detailed fiscal components:

- TAX_RNW: Renewable-energy-related tax/levy component
- TAX_CAP: Capacity-related component
- TAX_ENV: Environmental component
- TAX_NUC: Nuclear-related component

Relevant application structures:

- energyTaxs
- codesDataset[dataset].nrg_prc
- colors
- componentColors

The exact statistical label and definition from the active dataset metadata must be
shown in explanations. Friendly labels must not replace the official definition.

2.8 Breakdown codes

- DP_ES
- DP_NC
- DP_TL

Relevant application structure:

- energyBreakdowns

The insight engine should map these to their official breakdown meanings from the
metadata or language files before generating narratives.

2.9 Dataset families

- nrg_pc_202: Household natural-gas prices
- nrg_pc_202_c: Household natural-gas components
- nrg_pc_203: Non-household natural-gas prices
- nrg_pc_203_c: Non-household natural-gas components
- nrg_pc_204: Household electricity prices
- nrg_pc_204_c: Household electricity components
- nrg_pc_205: Non-household electricity prices
- nrg_pc_205_c: Non-household electricity components

The non-component dataset supplies price levels and tax treatments. The matching `_c`
dataset supplies detailed component information.

===============================================================================
3. NORMALIZED ANALYTICAL CONTEXT
===============================================================================

Every insight should be calculated from an explicit context containing at least:

- dataset
- product
- consumer type
- consumption band
- geography
- period
- unit
- currency or PPS expression
- tax treatment
- component or breakdown, where relevant
- observation status or flags, where available

A normalized observation can conceptually contain:

- geo
- product
- consumer
- band
- period
- unit
- currency
- taxTreatment
- component
- breakdown
- value
- status
- sourceDataset

General comparability rule:
Two observations may be compared only if every dimension is identical except the
specific dimension intentionally being compared.

Examples:

- Country ranking: geography varies; all other dimensions match.
- Band comparison: band varies; all other dimensions match.
- Time change: period varies; all other dimensions match.
- EUR versus PPS position: currency varies; all other dimensions match.
- Tax treatment comparison: tax treatment varies; all other dimensions match.

===============================================================================
4. TWO INSIGHT EXPERIENCES
===============================================================================

4.1 Selected-view insights

Purpose:
Explain the user's current chart and filter selection.

Recommended sequence:

1. Selection context
2. Price snapshot
3. Main takeaway
4. Price development
5. European comparison
6. Historical position
7. Price composition
8. Drivers of change
9. Consumption-band effects
10. PPS perspective
11. Price stability
12. Data and interpretation notes

4.2 Global insights

Purpose:
Describe the European energy-price landscape for a selected comparable context.

Recommended sequence:

1. European snapshot
2. Countries rising, falling, or stable
3. Largest movements
4. Country distribution
5. Convergence or divergence
6. Price components across Europe
7. Fiscal effects
8. PPS rank shifts
9. Consumption-band patterns
10. Historical signals
11. Data coverage
12. Detailed evidence

===============================================================================
5. GENERAL NOTATION AND HELPER DEFINITIONS
===============================================================================

Let:

P(g,t,b,c,u,r,x) = price for geography g, period t, band b, consumer c,
                   unit u, price treatment r, and expression x (EUR/NAT/PPS)

For readability, formulas below use P_t when all dimensions other than period are
held constant.

Let:

- P_t = latest comparable price
- P_prev = immediately preceding semester price
- P_yoy = price in the same semester one year earlier
- P_base = selected baseline price
- P_EU = EU27_2020 benchmark price
- P_EA = euro-area benchmark price
- C_k,t = value of component k in period t
- N = number of valid comparable countries
- epsilon = tolerance used to classify negligible changes as stable

Safe percentage-change formula:

percentChange(A, B) = ((B - A) / abs(A)) * 100

Use only when A is non-zero and both values are valid.

Absolute change:

absoluteChange(A, B) = B - A

Percentage-point change for a share:

percentagePointChange = latestShare - earlierShare

Do not label a percentage-point change as a percent change.

===============================================================================
6. SELECTED-VIEW INSIGHTS AND FORMULAS
===============================================================================

6.1 SELECTION CONTEXT

Question:
What exactly is being analysed?

Display:

- Geography
- Energy product
- Consumer type
- Consumption band
- Period
- Unit
- Currency or PPS
- Tax treatment
- Component/breakdown, if applicable
- Reporting cohort size, if a rank is shown

Formula:
No numeric formula. Build the context from active dimensions and official labels.

Data required:
Current user selection, codesDataset configuration, language labels, and metadata.

Comment:
The context should remain visible because a price without its band, tax treatment,
unit, and consumer type is incomplete.

-------------------------------------------------------------------------------
6.2 LATEST PRICE

Question:
What is the current selected price?

Formula:

Latest price = P_t, where t is the latest valid period in the selected context.

Latest valid period:

latestPeriod = max(period where value is valid and not suppressed)

Display:

- P_t
- t
- unit and price expression
- selected band
- selected tax treatment

Data required:
Matching price dataset: nrg_pc_202, 203, 204, or 205.

Quality rule:
Do not silently substitute an earlier period without labelling it as the latest
available period for that geography.

-------------------------------------------------------------------------------
6.3 SEMESTER-ON-SEMESTER CHANGE

Question:
How has the price changed since the immediately preceding semester?

Formulas:

Absolute semester change = P_t - P_prev

Semester percent change = ((P_t - P_prev) / abs(P_prev)) * 100

Data required:
Latest and immediately preceding valid semester with identical dimensions.

Interpretation:
Use as a short-term movement. Do not use it alone as the primary structural change
because semester patterns may exist.

-------------------------------------------------------------------------------
6.4 YEAR-ON-YEAR CHANGE

Question:
How has the price changed from the same semester one year earlier?

For biannual periods:

- S1 compares with previous year's S1.
- S2 compares with previous year's S2.

Formulas:

Absolute YoY change = P_t - P_yoy

YoY percent change = ((P_t - P_yoy) / abs(P_yoy)) * 100

Data required:
Latest period and matching semester one year earlier.

Recommended priority:
Use YoY change as the primary change card; use semester-on-semester as secondary.

-------------------------------------------------------------------------------
6.5 SHORT-TERM MOMENTUM

Question:
Is the price movement accelerating, slowing, or reversing?

Let:

G_t = current YoY percent change
G_prev = YoY percent change calculated one semester earlier

Formula:

Momentum change = G_t - G_prev

Classification:

- G_t > epsilon and momentumChange > epsilon: rising and accelerating
- G_t > epsilon and momentumChange < -epsilon: rising but slowing
- G_t < -epsilon and momentumChange < -epsilon: falling and accelerating downward
- G_t < -epsilon and momentumChange > epsilon: falling but decline is slowing
- sign(G_t) differs from sign(G_prev): possible reversal
- abs(G_t) <= epsilon: broadly stable YoY

Data required:
At least four appropriately aligned semester observations for robust YoY momentum.

-------------------------------------------------------------------------------
6.6 MEDIUM-TERM CHANGE

Question:
How has the price changed over a selected multi-year period?

Recommended horizons:

- 2 years
- 5 years
- User-selected baseline
- Policy-relevant baseline

Use the same semester where possible.

Formulas:

Absolute medium-term change = P_t - P_base

Medium-term percent change = ((P_t - P_base) / abs(P_base)) * 100

Data required:
Latest and baseline observations with matching dimensions.

Comment:
The baseline must always be named. Avoid an unexplained comparison with the first
available observation.

-------------------------------------------------------------------------------
6.7 COMPOUND ANNUAL GROWTH RATE

Question:
What was the smoothed annual rate of change over a multi-year interval?

Formula:

CAGR = ((P_t / P_base)^(1 / years) - 1) * 100

Conditions:

- P_t > 0
- P_base > 0
- years > 0
- Use only over sufficiently long intervals, normally at least 3 years.

Data required:
Latest value, baseline value, and elapsed years.

Interpretation:
Label as a smoothed annual rate, not the actual change observed in each year.

-------------------------------------------------------------------------------
6.8 EU AND EURO-AREA COMPARISON

Question:
How does the selected geography compare with European benchmarks?

Formulas:

Absolute EU gap = P_country - P_EU

Relative EU gap = ((P_country - P_EU) / abs(P_EU)) * 100

Absolute EA gap = P_country - P_EA

Relative EA gap = ((P_country - P_EA) / abs(P_EA)) * 100

Suggested wording thresholds, configurable:

- abs(gap) < 2%: broadly in line with benchmark
- 2% <= abs(gap) < 10%: slightly above/below
- 10% <= abs(gap) < 25%: above/below
- abs(gap) >= 25%: considerably above/below

Data required:
Country observation and matching EU27_2020 or EA aggregate.

Comment:
Use the official aggregate supplied by Eurostat. Do not recalculate a simple
country average and label it as the EU average.

-------------------------------------------------------------------------------
6.9 COUNTRY MEDIAN COMPARISON

Question:
How does the selected geography compare with the middle reporting country?

Formula for sorted valid country values x_1...x_N:

If N is odd:
Median = x_((N+1)/2)

If N is even:
Median = (x_(N/2) + x_(N/2+1)) / 2

Country-median relative gap:

((P_country - Median) / abs(Median)) * 100

Data required:
All comparable individual-country observations.

Comment:
Do not include EU27_2020 or EA in the country median. Clearly distinguish the
country median from the official EU aggregate.

-------------------------------------------------------------------------------
6.10 COUNTRY RANK

Question:
Where does the selected country sit among comparable reporting countries?

Descending rank, where the highest price is rank 1:

rankHigh = 1 + count(countryValue > selectedValue)

Ascending rank, where the lowest price is rank 1:

rankLow = 1 + count(countryValue < selectedValue)

Tie-aware display:
Use competition ranking or dense ranking consistently. If values are equal within a
rounding tolerance, display "joint rank".

Data required:
All valid comparable individual countries.

Display:

- Rank
- Direction: highest or lowest
- N reporting countries
- Selected comparison context

Comment:
Do not use "best" or "worst."

-------------------------------------------------------------------------------
6.11 COUNTRY PERCENTILE POSITION

Question:
What share of reporting countries has a lower price?

A simple empirical percentile formula:

percentile = 100 * (count(values < selectedValue) + 0.5 * count(values = selectedValue)) / N

Alternative rank-based formula:

percentile = 100 * (N - rankHigh + 0.5) / N

Use one method consistently.

Classification example:

- Below 25th percentile: lowest-price quartile
- 25th to below 50th: lower-middle quartile
- 50th to below 75th: upper-middle quartile
- 75th and above: highest-price quartile

Data required:
Comparable country distribution.

-------------------------------------------------------------------------------
6.12 STATISTICAL OUTLIER POSITION

Question:
Is the selected value unusually far from the central country distribution?

Robust IQR method:

IQR = Q3 - Q1

Lower fence = Q1 - 1.5 * IQR

Upper fence = Q3 + 1.5 * IQR

Classification:

- Price < lower fence: low statistical outlier
- Price > upper fence: high statistical outlier
- Otherwise: within the main distribution

Data required:
Sufficient comparable country observations, preferably at least 8-10.

Comment:
"Statistical outlier" is descriptive and must not imply an error or policy judgment.

-------------------------------------------------------------------------------
6.13 HISTORICAL MINIMUM, MAXIMUM, AND RANGE

Question:
What are the series extremes?

Formulas:

Historical minimum = min(P_1...P_t)

Historical maximum = max(P_1...P_t)

Historical range = maximum - minimum

Distance from maximum = P_t - maximum

Percent below maximum = ((P_t - maximum) / abs(maximum)) * 100

Distance above minimum = P_t - minimum

Percent above minimum = ((P_t - minimum) / abs(minimum)) * 100

Data required:
Full valid historical series for identical dimensions.

-------------------------------------------------------------------------------
6.14 HISTORICAL MEDIAN AND CURRENT GAP

Question:
How does the current price compare with the typical historical value?

Formula:

Historical median = median(P_1...P_t)

Absolute gap from historical median = P_t - historicalMedian

Relative gap = ((P_t - historicalMedian) / abs(historicalMedian)) * 100

Data required:
Full valid historical series.

-------------------------------------------------------------------------------
6.15 HISTORICAL PERCENTILE

Question:
Is the current price high or low compared with its own history?

Formula:

historicalPercentile = 100 *
(count(historical values < P_t) + 0.5 * count(values = P_t)) / numberOfHistoricalValues

Suggested classification:

- 0-20: very low relative to history
- >20-40: below typical historical range
- >40-60: near historical middle
- >60-80: above typical historical range
- >80-100: very high relative to history

Data required:
Preferably at least 10 historical observations.

-------------------------------------------------------------------------------
6.16 PERIODS SINCE PEAK

Question:
How long has it been since the historical maximum?

Formula for ordered semester index:

periodsSincePeak = index(latestPeriod) - index(mostRecentPeakPeriod)

If periods are biannual:

approximateYearsSincePeak = periodsSincePeak / 2

Data required:
Ordered full time series.

Comment:
If the maximum occurs multiple times, use the most recent peak and disclose ties if
relevant.

-------------------------------------------------------------------------------
6.17 CONSECUTIVE INCREASES OR DECREASES

Question:
How persistent is the latest movement?

Formula:
Starting with the latest observation, count consecutive period-to-period differences
with the same direction until the direction changes or a value is missing.

- Increase if P_i - P_(i-1) > stabilityThreshold
- Decrease if P_i - P_(i-1) < -stabilityThreshold
- Stable otherwise

Data required:
Ordered series with adjacent valid observations.

Possible result:
"Third consecutive semester increase."

-------------------------------------------------------------------------------
6.18 TREND REVERSAL

Question:
Has a sustained direction changed?

Simple rule:

- Require at least two consecutive movements in one direction.
- Latest movement must be in the opposite direction.
- Latest movement must exceed the stability threshold.

Alternative robust rule:
Compare short moving-average slopes:

recentSlope = slope(last 3 or 4 observations)
previousSlope = slope(preceding 3 or 4 observations)

A possible reversal occurs when signs differ and both magnitudes exceed a configured
minimum.

Data required:
At least 5-8 valid observations depending on method.

-------------------------------------------------------------------------------
6.19 CURRENT PRICE COMPOSITION

Question:
What makes up the current final price?

For component k:

Component share k = (C_k,t / P_total,t) * 100

Component sum check:

componentSum = sum(C_k,t)

Reconciliation gap = P_total,t - componentSum

Relative reconciliation gap = reconciliationGap / abs(P_total,t) * 100

Data required:
Matching `_c` dataset for the same geography, product, consumer, band, period, unit,
and currency.

Recommended broad groups:

- Energy and supply: NRG_SUP
- Network: NETC
- Fiscal excluding VAT: TAX_LEV_X_VAT or available detailed fiscal components
- VAT: VAT
- Other: OTH

Quality rule:
Only present shares as a complete decomposition when components reconcile with the
total within an approved tolerance. Otherwise label the breakdown as partial.

-------------------------------------------------------------------------------
6.20 DETAILED FISCAL COMPOSITION

Question:
What makes up the fiscal part of the price?

Possible fiscal component set:

- TAX_RNW
- TAX_CAP
- TAX_ENV
- TAX_NUC
- VAT
- OTH, only if official metadata places it in the fiscal grouping

Formulas:

Detailed fiscal total = sum(valid fiscal components)

Fiscal component share of final price = fiscalComponent / finalPrice * 100

Fiscal component share of fiscal total = fiscalComponent / fiscalTotal * 100

Data required:
Detailed component records and official metadata mapping.

Comment:
Do not double count a broad tax total together with its detailed subcomponents.

-------------------------------------------------------------------------------
6.21 COMPONENT ANNUAL CHANGE

Question:
How did each component change from one year earlier?

For component k:

Absolute component change = C_k,t - C_k,yoy

Component percent change = ((C_k,t - C_k,yoy) / abs(C_k,yoy)) * 100

Data required:
Component values for latest and same semester one year earlier.

Comment:
If the earlier component is zero, show absolute change only.

-------------------------------------------------------------------------------
6.22 COMPONENT CONTRIBUTION TO TOTAL PRICE CHANGE

Question:
Which component accounted for the final price movement?

Total price change:

DeltaTotal = P_total,t - P_total,yoy

Component change:

DeltaC_k = C_k,t - C_k,yoy

Contribution in price units:

ContributionValue_k = DeltaC_k

Contribution percentage, where DeltaTotal is non-zero:

ContributionPercent_k = (DeltaC_k / DeltaTotal) * 100

Reconciliation:

sum(DeltaC_k) should approximately equal DeltaTotal.

Important interpretation:
Contribution percentages may be negative or greater than 100% when components offset
one another. Therefore, user-facing narratives should prioritize component changes in
price units and classify roles instead of relying only on percentages.

Suggested role classification:

- Main upward driver: largest positive DeltaC_k
- Secondary upward driver: other material positive DeltaC_k
- Main downward driver: most negative DeltaC_k
- Offsetting component: component with opposite sign to DeltaTotal
- Broadly unchanged: abs(DeltaC_k) below a component threshold
- Mixed movement: no component dominates

Dominance ratio:

Dominance_k = abs(DeltaC_k) / sum(abs(DeltaC_j)) * 100

A component may be called dominant when its dominance ratio exceeds a configurable
threshold, for example 50%.

-------------------------------------------------------------------------------
6.23 FISCAL CUSHIONING OR AMPLIFICATION

Question:
Did taxes and levies reduce or increase the movement in the final price?

Define:

P_preTax,t = applicable price excluding taxes
P_final,t = applicable final price including relevant taxes/VAT

DeltaPreTax = P_preTax,t - P_preTax,yoy

DeltaFinal = P_final,t - P_final,yoy

Fiscal effect value:

FiscalEffect = DeltaFinal - DeltaPreTax

Classification:

- DeltaPreTax > 0 and 0 < DeltaFinal < DeltaPreTax:
  fiscal changes cushioned the underlying increase

- DeltaPreTax > 0 and DeltaFinal > DeltaPreTax:
  fiscal changes amplified the increase

- DeltaPreTax < 0 and DeltaFinal < 0 and abs(DeltaFinal) < abs(DeltaPreTax):
  fiscal changes partly offset the underlying decrease

- DeltaPreTax < 0 and DeltaFinal > 0:
  final price increased despite an underlying pre-tax decrease

- DeltaPreTax > 0 and DeltaFinal < 0:
  final price decreased despite an underlying pre-tax increase

Data required:
Comparable price treatments such as X_TAX, X_VAT, and I_TAX according to official
definitions.

Comment:
Use the dataset's exact definitions. Do not assume all tax treatments have identical
meaning for household and non-household consumers.

-------------------------------------------------------------------------------
6.24 SELECTED BAND VERSUS REFERENCE BAND

Question:
How does the selected consumption band compare with the standard/default band?

Formulas:

Absolute band gap = P_selectedBand - P_referenceBand

Relative band gap = ((P_selectedBand - P_referenceBand) /
                    abs(P_referenceBand)) * 100

Data required:
Same geography, period, product, consumer, unit, currency, and tax treatment; only band
varies.

Reference:
Use the active dataset's defaultConsom or another explicitly documented reference band.

-------------------------------------------------------------------------------
6.25 LOWEST- VERSUS HIGHEST-CONSUMPTION BAND SPREAD

Question:
How different are unit prices at the two ends of the consumption profile?

Formulas:

Absolute spread = P_lowConsumptionBand - P_highConsumptionBand

Relative spread using high-consumption band as reference =
((P_lowConsumptionBand - P_highConsumptionBand) /
 abs(P_highConsumptionBand)) * 100

Alternative symmetric percentage difference:

Symmetric gap = 200 * (P_low - P_high) / (abs(P_low) + abs(P_high))

Data required:
Valid observations for ordered extreme bands within the same context.

Comment:
Do not include total bands in the ordering of bounded consumption bands unless
specifically intended.

-------------------------------------------------------------------------------
6.26 CONSUMPTION-BAND PATTERN

Question:
Does unit price generally rise or fall as consumption increases?

Order bands using an explicit metadata sequence, not alphabetically.

Adjacent differences:

D_i = P_(band i+1) - P_(band i)

Classification with threshold epsilonBand:

- All D_i < -epsilonBand: decreases with consumption
- All D_i > epsilonBand: increases with consumption
- All abs(D_i) <= epsilonBand: broadly flat
- Direction changes from negative to positive: possible U-shape
- Direction changes from positive to negative: possible inverted U-shape
- Otherwise: mixed or irregular

Optional linear trend:

Fit P_band = alpha + beta * orderedBandIndex

- beta materially below zero: declining unit-price pattern
- beta materially above zero: increasing unit-price pattern

Use the categorical rule for user-facing interpretation; use regression only as
supporting evidence.

-------------------------------------------------------------------------------
6.27 BAND DIFFERENCE DRIVER

Question:
Which component explains the selected-versus-reference band difference?

For component k:

BandComponentGap_k = C_k,selectedBand - C_k,referenceBand

Band total gap:

BandTotalGap = P_selectedBand - P_referenceBand

Role classifications follow the component-contribution logic:

- Main contributor to higher selected-band price
- Main contributor to lower selected-band price
- Offsetting component
- Mixed

Data required:
Component data for both bands in the same period and context.

-------------------------------------------------------------------------------
6.28 BAND SPREAD OVER TIME

Question:
Are differences between consumption bands widening or narrowing?

Define per period:

BandSpread_t = P_lowBand,t - P_highBand,t

Change in spread:

DeltaBandSpread = BandSpread_t - BandSpread_yoy

Relative change in spread:

((BandSpread_t - BandSpread_yoy) / abs(BandSpread_yoy)) * 100

Classification:

- Positive material change: spread widened
- Negative material change: spread narrowed
- Within tolerance: broadly unchanged

-------------------------------------------------------------------------------
6.29 EUR VERSUS PPS RANK SHIFT

Question:
Does purchasing-power adjustment change the country's European position?

Compute comparable descending ranks:

Rank_EUR = rank of selected country using EUR values
Rank_PPS = rank of selected country using PPS values

Define upward pressure shift so a positive value means a higher-price position in PPS:

PPSRankShift = Rank_EUR - Rank_PPS

Examples:

- EUR rank 14, PPS rank 5: shift = +9
- EUR rank 4, PPS rank 11: shift = -7

Classification example:

- shift >= +5: materially higher position in PPS
- shift <= -5: materially lower position in PPS
- otherwise: broadly similar position

Data required:
Matched EUR and PPS observations for the same context and a sufficiently common country
cohort.

Critical cohort rule:
Calculate both ranks on the intersection of countries with valid EUR and PPS values.
Otherwise rank shifts may reflect changing coverage rather than purchasing-power
adjustment.

-------------------------------------------------------------------------------
6.30 EUR AND PPS BENCHMARK GAPS

Question:
How does the country compare with the EU under each price expression?

Formulas:

EUR EUGap% = ((P_country,EUR - P_EU,EUR) / abs(P_EU,EUR)) * 100

PPS EUGap% = ((P_country,PPS - P_EU,PPS) / abs(P_EU,PPS)) * 100

PPS interpretation shift:

GapShift = PPS EUGap% - EUR EUGap%

A positive GapShift means the country appears relatively more expensive against the EU
benchmark in PPS terms than in EUR terms.

Comment:
Call this an affordability or purchasing-power perspective, not a direct measure of
energy poverty or household affordability.

-------------------------------------------------------------------------------
6.31 HISTORICAL PPS PRESSURE TREND

Question:
Is the EUR-versus-PPS interpretation gap widening or narrowing?

For each period:

RankShift_t = Rank_EUR,t - Rank_PPS,t

or

GapShift_t = PPS EUGap%_t - EUR EUGap%_t

Change over time:

DeltaRankShift = RankShift_t - RankShift_base

DeltaGapShift = GapShift_t - GapShift_base

Classification:

- Material positive change: relative PPS pressure widened
- Material negative change: relative PPS pressure narrowed
- Otherwise: broadly stable

Use a common country cohort where possible.

-------------------------------------------------------------------------------
6.32 HISTORICAL VOLATILITY

Question:
How variable has the price been?

Preferred input:
Percentage changes rather than raw price levels.

For returns r_i:

r_i = (P_i - P_(i-1)) / abs(P_(i-1))

Mean return:

mean_r = sum(r_i) / n

Sample standard deviation:

volatility = sqrt(sum((r_i - mean_r)^2) / (n - 1))

Express as a percentage if r_i values are multiplied by 100.

Alternative robust measure:

MAD = median(abs(r_i - median(r)))

Robust volatility estimate = 1.4826 * MAD

Data required:
A configurable window, for example the last 5 years or 10 semesters, with sufficient
valid observations.

Comment:
Do not annualize unless there is a clear user need and documented method.

-------------------------------------------------------------------------------
6.33 RELATIVE VOLATILITY RANK

Question:
Is the selected country more or less volatile than comparable countries?

Steps:

1. Calculate volatility for each country over the same date window.
2. Retain countries meeting the minimum data-completeness rule.
3. Calculate selected country's percentile using the empirical percentile formula.

Classification example:

- Below 25th percentile: relatively stable
- 25th-75th: typical volatility
- Above 75th: relatively volatile
- Above 90th: highly volatile

Data required:
Comparable historical country series over a common window.

-------------------------------------------------------------------------------
6.34 COMPONENT VOLATILITY

Question:
Which component contributes most to price instability over time?

For each component k:

componentVolatility_k = standard deviation of component period-to-period changes

or, where values are consistently positive:

componentPercentVolatility_k = standard deviation of component percentage changes

Dominant volatile component:

argmax(componentVolatility_k)

Data required:
Historical component series.

Comment:
Absolute volatility in price units may be more robust when components approach zero.

===============================================================================
7. GLOBAL EUROPEAN INSIGHTS AND FORMULAS
===============================================================================

All global calculations must first establish a comparable context: product, consumer,
band, period, unit, currency/PPS, and tax treatment.

7.1 EUROPEAN SNAPSHOT

Metrics:

- EU aggregate: official P_EU
- EA aggregate: official P_EA
- Country median: median of individual reporting countries
- Minimum country price: min(P_g)
- Maximum country price: max(P_g)
- Reporting countries: count(valid individual countries)
- Coverage rate: valid eligible countries / eligible countries * 100

Do not include EU and EA aggregates in country minima, maxima, median, or ranks.

-------------------------------------------------------------------------------
7.2 COUNTRIES RISING, FALLING, OR STABLE

For each country g:

YoY_g = ((P_g,t - P_g,yoy) / abs(P_g,yoy)) * 100

Classification using epsilonDirection:

- YoY_g > epsilonDirection: rising
- YoY_g < -epsilonDirection: falling
- abs(YoY_g) <= epsilonDirection: stable
- Missing either period: unavailable

Counts:

RisingCount = count(rising countries)
FallingCount = count(falling countries)
StableCount = count(stable countries)
UnavailableCount = count(unavailable countries)

Shares:

RisingShare = RisingCount / validComparableCountries * 100

Equivalent formulas apply to other directions.

-------------------------------------------------------------------------------
7.3 LARGEST INCREASES AND DECREASES

Rank countries by YoY_g:

- Largest increases: descending YoY_g
- Largest decreases: ascending YoY_g

Eligibility:

- Both periods valid
- Same comparable context
- Geography is an individual country

Display both percentage and absolute changes to avoid overemphasizing small-base effects.

-------------------------------------------------------------------------------
7.4 COUNTRY ALIGNMENT WITH EU MOVEMENT

Question:
Did a country follow or diverge from the EU movement?

Formula:

Divergence_g = YoY_g - YoY_EU

Classification:

- Same sign and abs(Divergence_g) <= alignmentThreshold: broadly aligned
- Same sign and Divergence_g > threshold: stronger movement than EU
- Same sign and Divergence_g < -threshold: weaker movement than EU
- Opposite signs: opposite movement
- abs(YoY_EU) <= epsilon and abs(YoY_g) > threshold: national movement while EU stable

Data required:
Country and official EU YoY changes.

-------------------------------------------------------------------------------
7.5 CROSS-COUNTRY DISPERSION

Question:
How widely do country prices differ?

Recommended robust metrics:

Range = max(P_g) - min(P_g)

Interquartile range:

IQR_t = Q3_t - Q1_t

Median absolute deviation:

MAD_t = median(abs(P_g - median(P_g)))

Optional relative metric:

Coefficient of variation = standardDeviation(P_g) / mean(P_g) * 100

Use coefficient of variation only when the mean is positive and meaningful.

Also useful:

Max/min ratio = max(P_g) / min(P_g)

Use only when the minimum is positive.

-------------------------------------------------------------------------------
7.6 CONVERGENCE OR DIVERGENCE OVER TIME

Question:
Are national prices becoming more similar or more different?

Preferred formula:

DispersionChange% = ((IQR_t - IQR_yoy) / abs(IQR_yoy)) * 100

Classification:

- DispersionChange% < -threshold: convergence
- DispersionChange% > threshold: divergence
- Otherwise: broadly unchanged dispersion

Alternative:
Use change in MAD or coefficient of variation as a consistency check.

Quality rule:
Use the same country cohort in both periods, or explicitly report that cohort changes
may affect the result.

-------------------------------------------------------------------------------
7.7 PERSISTENT HIGH- OR LOW-PRICE COUNTRIES

Question:
Is a country's current position temporary or persistent?

For each period, classify countries into quartiles using that period's comparable
country distribution.

Over a window of W periods:

HighQuartilePersistence_g =
count(periods where country g is in top quartile) / validPeriods_g * 100

LowQuartilePersistence_g =
count(periods where country g is in bottom quartile) / validPeriods_g * 100

Example rule:

- Persistently high: top quartile in at least 75% of valid periods and at least 6 of
  the last 8 periods.
- Persistently low: bottom quartile under the same rule.

Data required:
Country history and minimum coverage.

-------------------------------------------------------------------------------
7.8 EUROPEAN COMPONENT COMPOSITION

Question:
What components are most important across Europe?

For each country and component:

Share_g,k = C_g,k / P_g,total * 100

Possible summaries:

- Median component share across countries
- EU aggregate component share, using official aggregate observations
- Interquartile range of component shares
- Countries with highest or lowest component shares

Important:
Do not average country shares and label the result as the EU aggregate component share.
Use separate labels:

- Official EU aggregate share
- Median country share

-------------------------------------------------------------------------------
7.9 COMPONENT DRIVING THE EUROPEAN MOVEMENT

Using official EU aggregate components:

DeltaC_EU,k = C_EU,k,t - C_EU,k,yoy

DeltaTotal_EU = P_EU,t - P_EU,yoy

Dominance_EU,k = abs(DeltaC_EU,k) / sum(abs(DeltaC_EU,j)) * 100

Classify the main upward contributor, main offsetting contributor, and mixed movement.

Data required:
EU aggregate component records for matching periods.

-------------------------------------------------------------------------------
7.10 COUNTRIES WITH FISCAL CUSHIONING OR AMPLIFICATION

For each country, calculate DeltaPreTax and DeltaFinal as defined in section 6.23.

Count and list countries in categories:

- Fiscal cushioning of an underlying increase
- Fiscal amplification of an increase
- Fiscal offset of an underlying decrease
- Opposite final and pre-tax directions
- Broadly neutral fiscal effect

A fiscal effect threshold should prevent tiny differences from producing strong labels.

-------------------------------------------------------------------------------
7.11 GLOBAL EUR-PPS RANK SHIFTS

Using the common EUR/PPS country cohort:

RankShift_g = Rank_EUR,g - Rank_PPS,g

Show:

- Largest positive shifts
- Largest negative shifts
- Countries in top quartile under both measures
- Countries with moderate EUR position but high PPS position
- Countries with high EUR position but moderate PPS position

Coverage note:
Report the number of countries included in the common cohort.

-------------------------------------------------------------------------------
7.12 GLOBAL CONSUMPTION-BAND SPREAD

For each country:

BandSpread_g = P_lowBand,g - P_highBand,g

RelativeBandSpread_g = BandSpread_g / abs(P_highBand,g) * 100

Global summaries:

- Median band spread
- IQR of band spread
- Largest positive spreads
- Negative or irregular spreads
- Countries with approximately flat band profiles

Only compare countries with the required band observations and identical remaining
dimensions.

-------------------------------------------------------------------------------
7.13 COUNTRIES NEAR HISTORICAL HIGH OR LOW

For each country:

PeakGap%_g = ((P_g,t - maxHistoricalPrice_g) /
             abs(maxHistoricalPrice_g)) * 100

MinimumGap%_g = ((P_g,t - minHistoricalPrice_g) /
                abs(minHistoricalPrice_g)) * 100

Possible rules:

- At historical high: latest equals maximum within tolerance
- Near historical high: latest within 5% of maximum
- Near historical low: latest within 5% of minimum

Thresholds must be configurable and shown in methodology.

-------------------------------------------------------------------------------
7.14 GLOBAL TURNING-POINT SUMMARY

Count countries with:

- New historical highs
- New historical lows
- Reversals from increase to decrease
- Reversals from decrease to increase
- At least three consecutive increases
- At least three consecutive decreases

Use the rules from sections 6.17 and 6.18 consistently.

===============================================================================
8. RELATED EUROSTAT CONTEXT
===============================================================================

External Eurostat datasets can enrich the interpretation, but should be shown as
"Related context," not automatically as causes of price movements.

8.1 GENERAL JOIN RULES

Before combining Enprices data with another Eurostat database:

- Harmonize geography codes.
- Harmonize time frequency.
- Document whether annual context is repeated across two semesters.
- Confirm units and price basis.
- Retain metadata and source dataset identifiers.
- Do not interpolate missing contextual data unless explicitly documented.
- Do not imply causation from a simple association.

8.2 ENERGY PRICE VERSUS GENERAL INFLATION

Question:
Did the selected energy price change faster than general consumer prices?

Let:

EnergyYoY = selected energy-price YoY percent change
HICPYoy = harmonised consumer-price YoY percent change for aligned period

Formula:

Relative inflation gap = EnergyYoY - HICPYoy

Interpretation:

- Positive: energy price increased faster, or fell more slowly, than general prices.
- Negative: energy price increased more slowly, or fell faster, than general prices.

Comment:
Use aligned frequencies and clarify whether semester averages were constructed.

8.3 PRICE VERSUS HOUSEHOLD ECONOMIC CONTEXT

Possible contextual indicators:

- Household disposable income
- PPS or purchasing-power measures
- Inability to keep home adequately warm
- Arrears on utility bills
- Household energy expenditure, where available

Possible calculations:

Difference from EU context benchmark:

ContextGap% = ((Context_country - Context_EU) / abs(Context_EU)) * 100

Standardized position for exploratory comparison:

z_price = (countryPrice - meanCountryPrice) / standardDeviationCountryPrice

z_context = (countryContext - meanContext) / standardDeviationContext

Do not convert this into a causal score. Present as a paired contextual position.

Possible narrative:
The selected geography combines a high PPS-adjusted energy-price position with an
above-average value for the chosen social-context indicator.

8.4 PRICE VERSUS ENERGY-SYSTEM CONTEXT

Possible contextual indicators:

- Energy import dependency
- Electricity generation mix
- Renewable-energy share
- Fossil-fuel share
- Natural-gas dependency
- Energy intensity

Possible descriptive formula:

Change alignment = sign(priceChange) compared with sign(contextIndicatorChange)

Optional exploratory correlation across countries:

Pearson correlation:

r = covariance(X,Y) / (standardDeviation(X) * standardDeviation(Y))

or Spearman rank correlation for non-linear monotonic relationships.

Strict interpretation rule:
Correlation is exploratory association only. Do not state that the contextual
indicator caused the energy-price outcome.

8.5 PRICE VERSUS INDUSTRIAL OR MACROECONOMIC CONTEXT

Possible indicators:

- Industrial production
- Producer prices
- GDP
- Exchange rates for national-currency views

Example indexed comparison:

PriceIndex_t = P_t / P_base * 100

ContextIndex_t = Context_t / Context_base * 100

Index gap = PriceIndex_t - ContextIndex_t

This can show whether energy prices grew faster or slower than the selected contextual
series from a common baseline.

===============================================================================
9. MAIN NARRATIVE TEMPLATES
===============================================================================

9.1 Standard selected-view narrative

"In [period], [consumer] [product] for [band] cost [latest price] in [geography],
using [tax treatment and expression]. This was [YoY change] compared with the same
semester one year earlier and [EU gap] relative to the EU benchmark. The current
value is [historical interpretation] and stands [peak gap] from the historical peak
recorded in [peak period]. [Main component] was the main contributor to the latest
price movement, while [offsetting component] [partly offset/amplified] the change."

9.2 Price composition narrative

"[Main component] is the largest component of the final price, accounting for
[component share]. [Second component] accounts for [share], while the combined fiscal
components account for [fiscal share]. The component values reconcile with
[complete/partial] coverage of the final price."

9.3 European comparison narrative

"The selected country has the [rank] highest price among [N] countries with comparable
data. Its price is [relative EU gap] above/below the EU aggregate and falls in the
[quartile] of the country distribution."

9.4 PPS narrative

"The country ranks [EUR rank] in EUR terms and [PPS rank] in PPS terms among the common
reporting cohort. The shift of [rank shift] places indicates that the price appears
[more/less/similarly] burdensome from a purchasing-power perspective. This is not a
direct measure of household affordability or energy poverty."

9.5 Band narrative

"The selected consumption band pays [band gap] more/less per unit than the reference
band. Across all available bands, unit prices [decrease/increase/remain broadly flat/
follow an irregular pattern] as consumption rises. [Component] explains the largest
part of the selected-versus-reference band difference."

9.6 Global narrative

"In [period], prices increased in [rising count] countries, decreased in [falling count],
and were broadly stable in [stable count]. The official EU aggregate changed by
[EU change]. Cross-country dispersion [widened/narrowed/remained broadly unchanged],
with the interquartile range changing by [dispersion change]. [Component] was the main
contributor to the EU-level movement."

===============================================================================
10. INSIGHT PRIORITY
===============================================================================

10.1 Always visible

1. Selection context
2. Latest price
3. Year-on-year change
4. EU comparison
5. Historical position

10.2 High-priority dynamic insights

Display when applicable:

- New historical maximum or minimum
- Major YoY movement
- Strong divergence from EU movement
- Dominant component driver
- Fiscal cushioning or amplification
- Large EUR-to-PPS rank shift
- Unusual band spread
- Trend reversal
- High recent volatility
- Material data-coverage warning

10.3 Secondary exploration

- Detailed fiscal breakdown
- All-band comparison
- Full ranking history
- Component volatility
- Alternative benchmarks
- External Eurostat context
- Detailed evidence table

10.4 Example relevance scoring concept

Possible points:

- New historical high: +100
- New historical low: +90
- Trend reversal: +75
- Absolute YoY change >= 20%: +70
- Absolute YoY change >= 10%: +50
- Absolute YoY change >= 5%: +30
- Absolute EU gap >= 25%: +45
- Absolute PPS rank shift >= 5 positions: +40
- Dominant component driver: +35
- Unusual band pattern: +30
- High volatility percentile: +25
- Incomplete comparison or insufficient data: exclude or apply a large penalty

Thresholds should be configurable, tested on the full historical database, and reviewed
for false-positive frequency.

===============================================================================
11. DATA AND INTERPRETATION ALERTS
===============================================================================

11.1 Data alerts

- Latest observation missing
- Benchmark unavailable
- Component breakdown missing
- Components do not reconcile with total
- Different latest periods across countries
- Insufficient historical depth
- PPS unavailable
- Incomplete band coverage
- Reduced country cohort
- Suppressed or low-reliability observations
- Official status/flag requires disclosure

11.2 Interpretation alerts

- Household and non-household tax definitions may differ
- EU aggregate is not the same as median country
- Rank uses a reduced reporting cohort
- Semester comparison may reflect seasonal patterns
- PPS provides context but is not a complete affordability measure
- External datasets indicate association, not causation
- Currency or unit conversion has been applied
- Total-band observations are not directly equivalent to bounded-band observations

11.3 Analytical alerts

- New historical high or low
- Large annual movement
- Strong divergence from EU pattern
- Components move in offsetting directions
- Major rank change
- Unusually wide consumption-band spread
- High recent volatility
- Opposite movement in pre-tax and final price

Suggested visual severity:

- Information
- Notable change
- Data limitation

Do not style every unusual observation as a warning or negative outcome.

===============================================================================
12. QUALITY AND CONSISTENCY RULES
===============================================================================

1. Never compare incompatible units.
2. Never mix EUR, NAT, and PPS unless the comparison is explicitly about expression.
3. Never rank countries across different consumption bands.
4. Never rank countries across different tax treatments.
5. Never include EU or EA aggregates as countries in ranks or medians.
6. Use same-semester comparisons for primary annual movement.
7. Name every baseline.
8. Apply minimum observation requirements to history and volatility insights.
9. Use a common country cohort for comparisons over time when possible.
10. Use a common EUR/PPS cohort for rank-shift analysis.
11. Reconcile component totals before describing a complete composition.
12. Avoid double counting broad tax totals and detailed tax subcomponents.
13. Show absolute and relative changes together when practical.
14. Use percentage points for changes in shares.
15. Treat zero and missing values differently.
16. Respect Eurostat observation flags and suppression rules.
17. Do not infer causation from component coincidence or external datasets.
18. Do not label high/low prices as good/bad by default.
19. Keep official metadata and source-dataset references available in evidence views.
20. Localize labels, number formatting, units, and narrative grammar.

===============================================================================
13. RECOMMENDED SELECTED-VIEW INFORMATION ARCHITECTURE
===============================================================================

A. Context strip

- Product
- Consumer
- Band
- Price treatment
- Currency/PPS
- Unit
- Geography
- Period

B. Four anchor cards

1. Latest price
2. YoY change
3. EU comparison
4. Historical position

C. Main takeaway

One concise paragraph combining price, change, benchmark, history, and strongest
explanatory fact.

D. Development

- Semester movement
- YoY movement
- Medium-term baseline
- Peak and recovery
- Turning points

E. Composition and drivers

- Current stacked composition
- Component shares
- Component contribution to change
- Fiscal cushioning/amplification

F. Consumer profile

- Selected versus reference band
- All-band pattern
- Band spread over time
- Main component explaining the band gap

G. PPS perspective

- EUR rank
- PPS rank
- Rank shift
- EU gaps under both expressions

H. Stability

- Recent volatility
- Volatility percentile
- Largest historical increase/decrease
- Most volatile component

I. Notes and evidence

- Data availability
- Comparison definitions
- Source datasets
- Detailed table

===============================================================================
14. RECOMMENDED GLOBAL INSIGHTS INFORMATION ARCHITECTURE
===============================================================================

A. Global context strip

Comparable product, consumer, band, tax treatment, expression, unit, and period.

B. European snapshot

- Official EU aggregate
- EA aggregate
- Country median
- Reporting countries
- Minimum and maximum
- EU YoY change

C. Direction

- Rising countries
- Falling countries
- Stable countries
- Unavailable comparisons

D. Largest movements

- Largest increases
- Largest decreases
- Strongest positive EU divergence
- Strongest negative EU divergence

E. Price distribution

- Quartiles
- IQR
- Outliers
- Convergence/divergence
- Historical evolution of dispersion

F. Components

- Official EU composition
- Median country composition
- Main EU movement driver
- Countries with unusual component shares

G. Fiscal effects

- Fiscal cushioning
- Fiscal amplification
- Opposite pre-tax/final directions

H. PPS

- Largest upward rank shifts
- Largest downward rank shifts
- High in both EUR and PPS
- Moderate EUR but high PPS

I. Consumption bands

- Median low/high band spread
- Largest spreads
- Flat profiles
- Irregular profiles
- Spread widening/narrowing

J. Historical signals

- At/near historical highs
- Furthest below peaks
- Persistent high/low quartile positions
- Reversals
- Consecutive movements

K. Coverage and evidence

- Missing countries
- Latest periods by country
- Component coverage
- PPS coverage
- Band coverage
- Evidence table

===============================================================================
15. MINIMUM VIABLE PRODUCT
===============================================================================

Phase 1 should include:

1. Latest price
2. YoY movement
3. Semester movement
4. EU comparison
5. Country rank and cohort size
6. Historical peak and historical percentile
7. Current component composition
8. Main component contribution to annual change
9. Fiscal cushioning/amplification
10. EUR-versus-PPS rank shift
11. Data-quality notes

Phase 2 should add:

12. Consumption-band premium and full band pattern
13. Band-spread evolution
14. Volatility and turning points
15. European convergence/divergence
16. Persistent country positions
17. Global component and fiscal summaries
18. Related Eurostat context

===============================================================================
16. PRODUCT PROMISE
===============================================================================

Enprices Insights explains:

- what consumers pay;
- how prices are changing;
- how countries compare;
- which components shape the final price;
- which components account for price movements;
- how results differ across consumption bands;
- how purchasing-power adjustment changes the picture;
- whether the current situation is historically unusual; and
- what data and methodological limitations users should consider.

The system should calculate many candidate signals but display only the most relevant,
well-supported insights for the current context.

===============================================================================
17. SOURCE AND METHODOLOGY COMMENTS
===============================================================================

Primary Enprices source families:

- nrg_pc_202 and nrg_pc_202_c
- nrg_pc_203 and nrg_pc_203_c
- nrg_pc_204 and nrg_pc_204_c
- nrg_pc_205 and nrg_pc_205_c

The production implementation should read official labels, definitions, units, flags,
and methodological notes from the Eurostat metadata and the tool's localized language
files. The formulas in this document define analytical transformations; they do not
replace official statistical definitions.

When contextual databases are added, each generated insight should retain:

- source dataset code;
- dimensions and filters;
- period alignment method;
- unit or transformation;
- observation count;
- missing-data rule;
- benchmark definition; and
- calculation formula identifier.

This makes every insight reproducible and suitable for an evidence table or an
accessible "How calculated" explanation.


 and this also 


 1. “What does this mean for me?”
The current structure explains the price per unit, but many users think in terms of a bill.
Indicative cost estimator
For household views, allow users to enter or select annual consumption.
Plain Text1Estimated annual energy charge2€1,448 per year3 4Based on:55,000 kWh × €0.2896/kWhShow more lines
Formula
Plain Text1Indicative annual energy cost =2selected price per kWh × annual consumption in kWhShow more lines
For gas reported in GJ:
Plain Text1Annual cost =2price per GJ × annual consumption in GJShow more lines
Important qualification
Call this an indicative energy cost, not an estimated final bill, unless the price includes all fixed charges and the calculation accurately represents the applicable tariff structure.
The explanation should clarify:

this is not an individual supplier offer;
actual bills depend on consumption, contract, fixed charges, location, and billing rules;
the statistical price represents a consumption band, not an individual tariff.

This could be one of the most useful features for non-expert users.

2. Consumption-band suitability
Users may not know whether Band DC, GJ20-199, or another technical category applies to them.
Add a small assistant:

Which consumption band applies to me?

The user enters annual consumption and the tool identifies the matching band.
Rule
Plain Text1Selected band =2the band whose lower and upper limits contain annual consumptionShow more lines
Boundary handling must follow the official band definitions precisely.
Example:
Plain Text1Your annual consumption: 3,500 kWh2Matching household electricity band:32,500 kWh < consumption < 5,000 kWhShow more lines
Also explain that total bands are aggregate statistical categories and may not represent an individual consumer profile.

3. “Why might this be happening?”
Price components explain the arithmetic movement, but users will naturally ask for broader explanations.
Add two clearly separated blocks.
What the data shows
Statements directly supported by the price and component databases:

energy and supply increased;
network costs decreased;
taxes partly offset an increase;
the final price moved differently from the pre-tax price.

Related context
Potentially relevant external indicators:

inflation;
energy import dependency;
generation mix;
renewable share;
gas dependency;
household income or PPS;
inability to keep the home adequately warm;
industrial production.

The wording should distinguish evidence levels:
Plain Text1Direct calculation2“Energy and supply accounted for most of the price increase.”3 4Related context5“The increase occurred during a period of higher general inflation.”6 7Not supported without deeper analysis8“Inflation caused the energy-price increase.”Show more lines
A visible “What the data can and cannot explain” note would be valuable.

4. Data freshness and revision status
Every insight should indicate how current and complete it is.
Show:

latest available semester;
date the data were last updated;
whether the value is provisional, estimated, or revised;
whether a newer period is available for some countries;
whether the selected country is missing the newest common period.

Example:
Plain Text1Latest common comparison period: 2025-S22Data last updated: April 2026329 of 31 eligible countries reported data4Two observations are provisionalShow more lines
This avoids a common problem: comparing one country’s latest value with another country’s older value.
Common-period principle
For ranking and cross-country insights, default to:
Plain Text1Latest period with sufficient comparable country coverageShow more lines
For a selected country’s own trend, default to:
Plain Text1Latest valid period for that countryShow more lines
If these differ, tell the user.

5. Confidence and evidence strength
Not all generated insights are equally robust. Add a simple evidence indicator.
Suggested levels
Strong evidence

complete matching observations;
full component reconciliation;
sufficient historical length;
broad country coverage;
common periods and cohorts.

Moderate evidence

reduced country cohort;
partial component coverage;
shorter history;
minor reconciliation differences.

Limited evidence

substantial missingness;
different periods;
very small comparison cohort;
components do not reconcile;
result depends heavily on one observation.

Example:
Plain Text1Evidence: Strong2Based on 29 comparable countries and 18 years of observations.Show more lines
This is better than presenting every generated sentence with equal authority.

6. Statistical significance versus material relevance
The database is generally a statistical enumeration rather than a sample survey in the ordinary sense, so “statistically significant” may not be the right framing for every result.
However, you still need a materiality threshold to avoid noisy insights such as:

The price increased by 0.03%.

Use two thresholds:
Numerical tolerance
Handles floating-point and rounding differences.
Plain Text1abs(change) < numerical tolerance2→ no detectable arithmetic changeShow more lines
User-relevance threshold
Handles changes that exist but are too small to emphasise.
Plain Text1abs(change percentage) < materiality threshold2→ broadly stableShow more lines
The threshold may differ by insight type:

price movement;
benchmark gap;
component contribution;
rank shift;
band spread;
volatility change.

The UI should not imply exact stability when a small change exists. Use:

“Broadly stable”

rather than:

“Unchanged”


7. Rank sensitivity
A country can move several ranking positions even when its price barely changes, simply because countries are closely grouped.
Add a rank-stability insight.
Rank movement
Plain Text1Rank change =2previous comparable rank − latest comparable rankShow more lines
But supplement it with the price movement:

The country moved from 11th to 7th highest, although its price increased by only 1.2%. Several countries had closely grouped values.

Rank density
Calculate the price gap between the selected country and nearby ranks:
Plain Text1Gap to country above =2price at rank − 1 minus selected price3 4Gap to country below =5selected price minus price at rank + 1Show more lines
If both gaps are very small, label the rank as sensitive:

The exact ranking is sensitive because several countries report very similar prices.

This prevents overinterpretation of league-table positions.

8. Country-selection mode
Users may want different comparison experiences. Support explicit modes.
Single-country mode
Answers:

What is the current price?
How has it changed?
How does it compare?
What explains it?

Country-comparison mode
Answers:

Which selected country is highest?
Which changed the most?
Are the countries converging?
Which components explain their difference?

European overview mode
Answers:

What is happening across Europe?
How many countries increased?
Where are the extremes?
Is dispersion widening?

The insight structure should adapt instead of forcing a single-country narrative onto every selection.

9. Direct country-to-country comparison
The specification covers country-versus-EU well, but users may want to compare two selected countries.
Price difference
Plain Text1Absolute difference =2Price A − Price BShow more lines
Plain Text1Relative difference using B as reference =2(Price A − Price B) / abs(Price B) × 100Show more lines
Component explanation
Plain Text1Component gap k =2Component A,k − Component B,kShow more lines
Narrative:

Country A’s final price is €0.041/kWh higher than Country B’s. Network costs explain the largest part of the difference, while their energy and supply components are similar.

Historical comparison
Include:

which country increased faster;
which peaked first;
whether the gap widened or narrowed;
whether the difference persists in PPS.

This would be particularly useful for policy and research users.

10. Gap decomposition between countries
You already have change decomposition over time. Add cross-country gap decomposition.
Plain Text1Total country gap =2Final price A − Final price BShow more lines

Plain Text1Component share of absolute gap =2abs(component gap k) /3sum(abs(all component gaps)) × 100Show more lines
Because components can offset each other, the narrative should say:

largest contributor to the gap;
component narrowing the gap;
similar component;
mixed difference.

Example:

Higher network and fiscal components make Country A more expensive, while its energy and supply component is lower and partly offsets the difference.


11. Real versus nominal price development
A historical price may rise partly because the general price level has risen.
If an appropriate deflator is available, add an optional inflation-adjusted view.
Real-price index
Choose an explicit base period:
Plain Text1Nominal price index t =2nominal price t / nominal price base × 100Show more lines
Plain Text1General price index t =2HICP t / HICP base × 100Show more lines
Plain Text1Real price index t =2nominal price index t / general price index t × 100Show more lines
Equivalent real-price formula:
Plain Text1Real price t in base-period prices =2nominal price t × general price index base /3general price index tShow more lines
Narrative:

The nominal price is 35% above its 2019 level, but approximately 16% higher after adjusting for general inflation.

Make the deflator, base period, and frequency alignment explicit.

12. Seasonal pattern insight
The document correctly prioritises year-on-year change, but users could benefit from a direct explanation of semester patterns.
Typical semester difference
For each complete year:
Plain Text1Semester difference y =2(P_y,S2 − P_y,S1) / abs(P_y,S1) × 100Show more lines
Then:
Plain Text1Typical S2 premium =2median of valid semester differencesShow more lines
Possible insight:

Historically, second-semester gas prices have been a median 4.3% higher than first-semester prices in this series.

Seasonally unusual movement
Plain Text1Seasonal deviation =2latest S1-to-S2 change − historical median S1-to-S2 changeShow more lines
This can identify:

The latest semester increase was considerably larger than the series’ typical seasonal movement.

Keep this descriptive unless you implement a formal seasonal-adjustment method.

13. Structural break and exceptional-period detection
Historical averages can become misleading after major shifts. Add detection of exceptional movements.
Possible simple method:
Plain Text1Change z-score =2(latest period change − mean historical change) /3standard deviation of historical changesShow more lines
Possible robust method:
Plain Text1Robust change score =2(latest change − median historical change) /3(1.4826 × MAD of historical changes)Show more lines
Potential label:

within normal historical variation;
unusually large movement;
exceptional movement.

Avoid presenting a statistical rule as proof of a structural break. Use:

“Unusually large relative to the historical series”

rather than:

“A new market regime has begun.”


14. Data anomaly safeguards
The insight engine should detect results that may be technically calculable but suspicious.
Check for:

negative prices where unexpected;
zero values;
sudden unit changes;
duplicate observations;
component sum larger than total beyond tolerance;
implausibly large percentage changes caused by a tiny denominator;
rank changes caused by changing country coverage;
abrupt component reclassification;
breaks in methodology;
missing intermediate semesters.

If detected, suppress the strong narrative and display:

The latest movement may be affected by a series break or data comparability issue. Review the metadata before interpreting the change.


15. Definitions in plain language
Technical codes should never reach users without translation.
Each insight should have a compact “i” explanation answering:

What it shows
How it is calculated
How to interpret it
What its limitations are
Which data were used

Example:
Plain Text1European position2 3What it shows4The selected country’s position among countries with comparable data.5 6How calculated7Countries are ordered by price for the same product, consumer type,8consumption band, period, unit, currency and tax treatment.9 10Limitations11The position can change when country coverage changes. Closely grouped12countries may exchange positions after small price movements.13 14Source15nrg_pc_204 · 2025-S2 · 29 reporting countriesShow more lines

16. Provenance and reproducibility
Every generated insight should have an internal evidence record, even if users see only a simplified version.
Store or expose:

insight ID;
formula ID;
source dataset;
component dataset, if used;
filters;
periods;
selected benchmark;
country cohort;
missing values;
calculation timestamp;
data extraction/update date;
transformation or conversion;
precision before rounding;
localized narrative version.

A “View calculation” action could show:
Plain Text1Latest value: 0.31242EU value: 0.27863 4Calculation:5(0.3124 − 0.2786) / 0.2786 × 1006= 12.13%7 8Displayed result:912.1% above the EU averageShow more lines
This would greatly increase trust among expert users.

17. Save, share, and export
Users should be able to preserve the analytical context.
Useful actions:

Copy insight text
Copy a citation-ready statement
Download evidence as CSV
Export the insight summary
Share a URL containing the active filters
Print an accessible report
Download chart data
Copy the calculation and source metadata

A shared link should preserve:

product;
consumer;
band;
geography;
period;
unit;
currency/PPS;
tax treatment;
comparison benchmark;
active insight section.


18. Accessibility requirements
The insight system should work without relying solely on colour, charts, or icons.
Include:

textual trend direction;
keyboard-accessible explanations;
focus management in the global dialog;
accessible names for visualisations;
evidence tables behind charts;
no colour-only distinction between increases and decreases;
meaningful reading order;
localized screen-reader text;
reduced-motion support;
sufficient contrast;
proper heading structure.

For example, a green upward arrow alone is insufficient. Use:

Increased by 6.8%

with the arrow as a secondary visual cue.
Also consider that green should not automatically mean “good” in a contextual price tool.

19. User-type presets
Different users need different levels of depth.
General public
Prioritise:

current price;
annual movement;
indicative annual cost;
EU comparison;
simple component explanation;
band finder.

Journalists
Prioritise:

largest increases and decreases;
ranks;
historical peaks;
European distribution;
downloadable evidence;
citation-ready wording.

Policy analysts
Prioritise:

component contributions;
tax effects;
band differences;
convergence/divergence;
PPS comparisons;
historical persistence;
contextual datasets.

Businesses
Prioritise:

non-household bands;
scale effects;
pre-tax treatment;
cross-country comparison;
volatility;
price-component evolution.

This could be implemented later as display presets without changing the calculation engine.

20. Localisation and narrative quality
Because Eurostat serves multiple languages, generated insights need more than translated labels.
Plan for:

pluralization;
decimal separators;
currency placement;
period naming;
grammatical gender;
country-name inflection where relevant;
translated comparison phrases;
translated methodological warnings;
avoiding English sentence concatenation patterns.

Prefer structured narrative tokens over assembling arbitrary fragments.
The displayed precision should also be consistent:

prices: appropriate precision for unit;
percentage change: usually one decimal;
component share: usually one decimal;
ranks: whole numbers;
calculation details: more precision than the headline.


21. Recommended additions to the TXT specification
I would add these as a final “user experience and trust” layer:
Essential before release

Data freshness and common-period rules
Plain-language definitions
Rank sensitivity
Evidence/provenance record
Materiality thresholds
Data-anomaly safeguards
Accessibility requirements
Country-to-country comparison
Seasonal-pattern handling
Clear separation of direct calculations and related context

High-value second phase

Indicative annual-cost estimator
Consumption-band finder
Real versus nominal price
Structural-change signal
User-type display presets
Save, share, and export
Multilingual narrative framework

My main conclusion
The calculation catalogue is already comprehensive. What remains is the trust and usability layer:

Help users select the right context, explain why an insight appears, disclose its evidence and limitations, and translate prices per unit into something understandable—without overstating what the data can prove.

The most important missing feature for ordinary users is probably the consumption-band finder plus indicative annual cost. The most important missing feature for professional users is transparent calculation provenance and comparability controls.