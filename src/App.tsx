import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LoanGraph {
  id: string;
  name: string;
  loanAmount: number;
  monthlyRental: number;
  interestRate: number;
  rentalIncrease: number;
  color: string;
}

function App() {
  const [graphs, setGraphs] = useState<LoanGraph[]>([
    {
      id: "1",
      name: "Scenario 1",
      loanAmount: 1600000,
      monthlyRental: 16000,
      interestRate: 0.1,
      rentalIncrease: 1.06,
      color: "rgb(255, 99, 132)",
    },
  ]);
  const [autoScaled, setAutoScaled] = useState(true);
  const [maxYears, setMaxYears] = useState(20);
  const [yAxisMin, setYAxisMin] = useState(-500000);
  const [yAxisMax, setYAxisMax] = useState(3000000);

  const colors = [
    "rgb(255, 99, 132)",
    "rgb(54, 162, 235)",
    "rgb(75, 192, 192)",
    "rgb(255, 205, 86)",
    "rgb(153, 102, 255)",
    "rgb(255, 159, 64)",
  ];

  const calculateLoanData = (graph: LoanGraph) => {
    let currentLoanAmount = graph.loanAmount;
    let yearlyRentalIncome = 12 * graph.monthlyRental;
    const loanInterestRate = graph.interestRate;
    const rentalIncreasePerYear = graph.rentalIncrease;
    const numYears = maxYears;

    const years = [];
    const loanAmounts = [];
    const yearlyBreakdown = [];
    let yearsToZero = null;

    // Add initial values
    years.push(0);
    loanAmounts.push(currentLoanAmount);

    for (let year = 0; year < numYears; year++) {
      const loanAmountStart = currentLoanAmount;
      const annualInterest = currentLoanAmount * loanInterestRate;
      const previousAmount = currentLoanAmount;
      currentLoanAmount =
        currentLoanAmount + annualInterest - yearlyRentalIncome;

      yearlyBreakdown.push({
        year: year + 1,
        loanAmountStart,
        interest: annualInterest,
        rentalIncome: yearlyRentalIncome,
        loanAmountEnd: currentLoanAmount,
      });

      yearlyRentalIncome = yearlyRentalIncome * rentalIncreasePerYear;

      years.push(year + 1);
      loanAmounts.push(currentLoanAmount);

      // More precise calculation for when loan reaches zero
      if (
        previousAmount > 0 &&
        currentLoanAmount <= 0 &&
        yearsToZero === null
      ) {
        // Calculate the exact point within the year when loan hits zero
        const monthlyRental = yearlyRentalIncome / rentalIncreasePerYear / 12;
        const monthlyInterest = (previousAmount * loanInterestRate) / 12;
        const monthlyReduction = monthlyRental - monthlyInterest;

        if (monthlyReduction > 0) {
          const monthsToZero = previousAmount / monthlyReduction;
          yearsToZero = year + monthsToZero / 12;
        } else {
          yearsToZero = year + 1;
        }
      }
    }

    return { years, loanAmounts, yearsToZero, yearlyBreakdown };
  };

  const chartData = useMemo(() => {
    const firstGraph = graphs[0];
    if (!firstGraph) return { labels: [], datasets: [] };

    const baseData = calculateLoanData(firstGraph);

    return {
      labels: baseData.years,
      datasets: graphs.map((graph) => {
        const data = calculateLoanData(graph);
        return {
          label: graph.name,
          data: data.loanAmounts,
          borderColor: graph.color,
          backgroundColor: graph.color
            .replace("rgb", "rgba")
            .replace(")", ", 0.2)"),
          tension: 0.1,
        };
      }),
    };
  }, [graphs, maxYears]);

  const addGraph = () => {
    const newId = (graphs.length + 1).toString();
    const colorIndex = graphs.length % colors.length;
    setGraphs([
      ...graphs,
      {
        id: newId,
        name: `Scenario ${newId}`,
        loanAmount: 1600000,
        monthlyRental: 16000,
        interestRate: 0.1,
        rentalIncrease: 1.06,
        color: colors[colorIndex],
      },
    ]);
  };

  const removeGraph = (id: string) => {
    setGraphs(graphs.filter((graph) => graph.id !== id));
  };

  const updateGraph = (id: string, updates: Partial<LoanGraph>) => {
    setGraphs(
      graphs.map((graph) =>
        graph.id === id ? { ...graph, ...updates } : graph
      )
    );
  };

  const options = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: "Loan Amount vs Rental Income Over Time",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ...(autoScaled
            ? {}
            : {
                min: yAxisMin,
                max: yAxisMax,
              }),
          ticks: {
            callback: function (value: string | number) {
              return "R" + Number(value).toLocaleString();
            },
          },
          grid: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            color: function (context: any) {
              if (context.tick.value === 0) {
                return "rgba(0, 0, 0, 0.32)"; // Red color for y=0 line
              }
              return "#e0e0e0"; // Default grid color
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lineWidth: function (context: any) {
              if (context.tick.value === 0) {
                return 3; // Thicker line for y=0
              }
              return 1; // Default line width
            },
          },
        },
        x: {
          title: {
            display: true,
            text: "Year",
          },
        },
      },
    }),
    [autoScaled, yAxisMin, yAxisMax]
  );

  return (
    <div
      style={{
        padding: "20px",
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Loan Analysis Dashboard</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <label style={{}}>Years:</label>
            <input
              type="number"
              min="5"
              max="50"
              value={maxYears}
              onChange={(e) => setMaxYears(Number(e.target.value))}
              style={{ width: "60px", padding: "5px" }}
            />
          </div>

          {!autoScaled && (
            <>
              <div
                style={{ display: "flex", gap: "5px", alignItems: "center" }}
              >
                <label style={{}}>Y-Min:</label>
                <input
                  type="number"
                  step="100000"
                  value={yAxisMin}
                  onChange={(e) => setYAxisMin(Number(e.target.value))}
                  style={{ width: "100px", padding: "5px" }}
                />
              </div>
              <div
                style={{ display: "flex", gap: "5px", alignItems: "center" }}
              >
                <label style={{}}>Y-Max:</label>
                <input
                  type="number"
                  step="100000"
                  value={yAxisMax}
                  onChange={(e) => setYAxisMax(Number(e.target.value))}
                  style={{ width: "100px", padding: "5px" }}
                />
              </div>
            </>
          )}

          <button
            onClick={() => setAutoScaled(!autoScaled)}
            style={{
              padding: "8px 16px",
              backgroundColor: autoScaled ? "#2196F3" : "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {autoScaled ? "Auto" : "Fixed"}
          </button>
          <button
            onClick={addGraph}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", gap: "20px", flex: 1 }}>
        {/* Chart */}
        <div style={{ flex: 2, minHeight: "400px" }}>
          <Line data={chartData} options={options} />
        </div>

        {/* Controls Panel for each graph */}
        <div
          style={{
            flex: 1,
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          {graphs.map((graph) => (
            <div
              key={graph.id}
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#f5f5f5",
                borderRadius: "5px",
                border: `2px solid ${graph.color}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  value={graph.name}
                  onChange={(e) =>
                    updateGraph(graph.id, { name: e.target.value })
                  }
                  style={{
                    fontWeight: "bold",
                    border: "none",
                    backgroundColor: "transparent",
                    outline: "none",
                    width: "120px",
                  }}
                />
                {graphs.length > 1 && (
                  <button
                    onClick={() => removeGraph(graph.id)}
                    style={{
                      padding: "3px 8px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Minimal Controls */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span style={{ width: "40px" }}>Loan:</span>
                  <span style={{ width: "60px" }}>
                    R{(graph.loanAmount / 1000000).toFixed(1)}M
                  </span>
                  <input
                    type="number"
                    min="500000"
                    max="5000000"
                    step="50000"
                    value={graph.loanAmount}
                    onChange={(e) =>
                      updateGraph(graph.id, {
                        loanAmount: Number(e.target.value),
                      })
                    }
                    style={{ flex: 1 }}
                  />
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span style={{ width: "40px" }}>Rent Income:</span>
                  <span style={{ width: "60px" }}>
                    R{(graph.monthlyRental / 1000).toFixed(0)}k
                  </span>
                  <input
                    type="number"
                    min="5000"
                    max="50000"
                    step="100"
                    value={graph.monthlyRental}
                    onChange={(e) =>
                      updateGraph(graph.id, {
                        monthlyRental: Number(e.target.value),
                      })
                    }
                    style={{ flex: 1 }}
                  />
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span style={{ width: "40px" }}>Interest Rate:</span>
                  <span style={{ width: "60px" }}>
                    {(graph.interestRate * 100).toFixed(1)}%
                  </span>
                  <input
                    type="number"
                    min="0.05"
                    max="0.20"
                    step="0.005"
                    value={graph.interestRate}
                    onChange={(e) =>
                      updateGraph(graph.id, {
                        interestRate: Number(e.target.value),
                      })
                    }
                    style={{ flex: 1 }}
                  />
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span style={{ width: "40px" }}>Rent Inc:</span>
                  <span style={{ width: "60px" }}>
                    {((graph.rentalIncrease - 1) * 100).toFixed(1)}%
                  </span>

                  <input
                    type="number"
                    min="1.00"
                    max="1.15"
                    step="0.01"
                    value={graph.rentalIncrease}
                    onChange={(e) =>
                      updateGraph(graph.id, {
                        rentalIncrease: Number(e.target.value),
                      })
                    }
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Payoff Time */}
              <div style={{ color: "#666", marginTop: "8px" }}>
                {(() => {
                  const data = calculateLoanData(graph);
                  if (data.yearsToZero) {
                    const years = Math.floor(data.yearsToZero);
                    const months = Math.round((data.yearsToZero - years) * 12);
                    return `Paid off: ${years}y ${months}m`;
                  }
                  return `Not paid off in ${maxYears} years`;
                })()}
              </div>

              {/* Yearly Breakdown Table */}
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "5px",
                  }}
                >
                  Yearly Breakdown:
                </div>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",

                    // fontFamily: "monospace",
                    backgroundColor: "white",
                    padding: "5px",
                    borderRadius: "3px",
                  }}
                >
                  {calculateLoanData(graph).yearlyBreakdown.map((year) => (
                    <div key={year.year} style={{ marginBottom: "2px" }}>
                      Year {year.year}: Start: {year.loanAmountStart.toFixed(0)}
                      . Interest: {year.interest.toFixed(0)}. Rental:{" "}
                      {year.rentalIncome.toFixed(0)}. End:{" "}
                      {year.loanAmountEnd.toFixed(0)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
