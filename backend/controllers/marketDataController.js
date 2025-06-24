import axios from "axios";

// Nasdaq API configuration
const NASDAQ_API_KEY = process.env.NASDAQ_API_KEY || "demo_key";
const NASDAQ_BASE_URL = "https://data.nasdaq.com/api/v3";

// Cash crop symbols mapping
const CASH_CROP_SYMBOLS = {
  coffee: "CHRIS/ICE_KC1", // Coffee futures
  cocoa: "CHRIS/ICE_CC1", // Cocoa futures
  cotton: "CHRIS/ICE_CT1", // Cotton futures
  sugar: "CHRIS/ICE_SB1", // Sugar futures
  palm_oil: "CHRIS/CME_DA1", // Palm oil futures
};

export const getCashCropPrices = async (req, res) => {
    try {
        const { crops, days = 30 } = req.query;
        const requestedCrops = crops
        ? crops.split(",")
        : Object.keys(CASH_CROP_SYMBOLS);

        const priceData = {};

        for (const crop of requestedCrops) {
            if (CASH_CROP_SYMBOLS[crop]) {
                try {
                    // i did not have money for subscribing to Nasdaq so I'll just mock results
                    // In production, replace with actual API call
                    const mockData = generateMockPriceData(crop, days);
                    priceData[crop] = mockData;

          // Actual API call would be:
          // const response = await axios.get(`${NASDAQ_BASE_URL}/datasets/${CASH_CROP_SYMBOLS[crop]}/data.json`, {
          //   params: {
          //     api_key: NASDAQ_API_KEY,
          //     rows: days,
          //     order: 'desc'
          //   }
          // });
          // priceData[crop] = response.data.dataset_data;
        } catch (error) {
            console.error(`Error fetching ${crop} data:`, error);
            priceData[crop] = { error: "Data unavailable" };
        }
    }
    }

    res.json({
        success: true,
        data: priceData,
        timestamp: new Date().toISOString(),
        source: "Nasdaq Global Commodities",
    });
} catch (error) {
        console.error("Market data fetch error:", error);
        res
        .status(500)
        .json({ message: "Server error while fetching market data" });
    }
};

export const getCashCropTrends = async (req, res) => {
    try {
        const { crop, period = "1M" } = req.query;

        if (!crop || !CASH_CROP_SYMBOLS[crop]) {
            return res.status(400).json({ message: "Invalid crop symbol" });
        }

    // Generate trend analysis (mock data for demo)
    const trendData = generateTrendAnalysis(crop, period);

    res.json({
        success: true,
        crop,
        period,
        trend: trendData,
        timestamp: new Date().toISOString(),
    });
    } catch (error) {
        console.error("Trend analysis error:", error);
        res.status(500).json({ message: "Server error while analyzing trends" });
    }
};

export const getMarketSummary = async (req, res) => {
    try {
        const summary = {
        coffee: {
            currentPrice: 1.85,
            change: 0.05,
            changePercent: 2.78,
            volume: 15420,
            high: 1.89,
            low: 1.82,
            currency: "USD/lb",
        },
        cocoa: {
            currentPrice: 2.45,
            change: -0.03,
            changePercent: -1.21,
            volume: 8930,
            high: 2.48,
            low: 2.41,
            currency: "FCAFA/lb",
        },
        cotton: {
            currentPrice: 0.72,
            change: 0.01,
            changePercent: 1.41,
            volume: 12340,
            high: 0.73,
            low: 0.71,
            currency: "USD/lb",
        },
        sugar: {
            currentPrice: 0.19,
            change: 0.002,
            changePercent: 1.06,
            volume: 18750,
            high: 0.192,
            low: 0.188,
            currency: "USD/lb",
        },
        palm_oil: {
            currentPrice: 1.12,
            change: -0.02,
            changePercent: -1.75,
            volume: 9870,
            high: 1.15,
            low: 1.1,
            currency: "USD/kg",
        },
        };

        res.json({
        success: true,
        summary,
        lastUpdated: new Date().toISOString(),
        marketStatus: "OPEN",
        });
    } catch (error) {
        console.error("Market summary error:", error);
        res
        .status(500)
        .json({ message: "Server error while fetching market summary" });
    }
    };

// Helper functions for mock data generation
function generateMockPriceData(crop, days) {
    const data = [];
    const basePrice = getBasePriceForCrop(crop);

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const volatility = 0.05; // 5% daily volatility
        const change = (Math.random() - 0.5) * 2 * volatility;
        const price = basePrice * (1 + change);

        data.push({
        date: date.toISOString().split("T")[0],
        price: parseFloat(price.toFixed(4)),
        volume: Math.floor(Math.random() * 10000) + 5000,
        });
    }

    return {
        column_names: ["Date", "Price", "Volume"],
        data: data.reverse(),
    };
    }

    function getBasePriceForCrop(crop) {
    const basePrices = {
        coffee: 1.85,
        cocoa: 2.45,
        cotton: 0.72,
        sugar: 0.19,
        palm_oil: 1.12,
    };
    return basePrices[crop] || 1.0;
    }

    function generateTrendAnalysis(crop, period) {
    const trends = ["BULLISH", "BEARISH", "NEUTRAL"];
    const trend = trends[Math.floor(Math.random() * trends.length)];

    return {
        direction: trend,
        strength: Math.floor(Math.random() * 100),
        support: getBasePriceForCrop(crop) * 0.95,
        resistance: getBasePriceForCrop(crop) * 1.05,
        recommendation:
        trend === "BULLISH" ? "BUY" : trend === "BEARISH" ? "SELL" : "HOLD",
    };
    }
