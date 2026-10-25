# TWIN: Deterministic Personality Matching Algorithm Specification

## 1. Core Principles

The TWIN Matching Engine is **deterministic, mathematically transparent, and explainable**.
- **No LLM Hallucinations**: Scores are computed via reproducible arithmetic functions, not probabilistic generative models.
- **Fair Missing-Data Treatment**: Missing data is neither rewarded with a false 100% nor penalized as an ideological disagreement.
- **Multi-Select Overlap**: Athletic and gaming pursuits use Jaccard set theory.
- **Stable Tie-Breaking**: Deterministic sorting ensures users receive consistent rankings across sessions.

---

## 2. Category Weight Distribution

The algorithm computes similarity across 9 taste and lifestyle dimensions:

| Category Dimension | Relative Weight ($w_i$) | Comparison Method | Attribute Fields |
| :--- | :--- | :--- | :--- |
| **Sports & Gaming** | **15% (0.15)** | Jaccard Set Similarity | `q_sports` (Multi-select) |
| **Weekend Leisure** | **15% (0.15)** | Categorical Exact Match | `q_leisure` |
| **Ideal Places** | **15% (0.15)** | Categorical Exact Match | `q_places` |
| **Coffee Ritual** | **10% (0.10)** | Categorical Exact Match | `q_coffee` |
| **Comfort Food** | **10% (0.10)** | Categorical Exact Match | `q_food` |
| **Driving Philosophy** | **10% (0.10)** | Categorical Exact Match | `q_cars` |
| **Daily Energy Vibe** | **10% (0.10)** | Categorical Exact Match | `q_vibe` |
| **Daily Rhythm & Pace** | **10% (0.10)** | Categorical Exact Match | `q_lifestyle` |
| **Refreshing Drinks** | **5% (0.05)** | Categorical Exact Match | `q_drinks` |
| **Total Weight** | **100% (1.00)** | — | — |

---

## 3. Mathematical Formulation

### 3.1. Sports & Gaming Jaccard Index
For a user's multi-select sports activities $A$ and another user's sports activities $B$:

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

- **Edge Case: Both Inactive**: If both users explicitly declare `sport_none` (no regular sports), $J(A, B) = 1.0$.
- **Edge Case: One Inactive, One Active**: If one user has `sport_none` and the other has active sports, $J(A, B) = 0.0$.
- **Edge Case: Empty Selection**: If either array is unselected, this dimension is flagged as *unobserved*.

### 3.2. Categorical Dimension Similarity
For single-select categorical preferences (e.g. V60 Coffee vs Flat White):

$$s_i(x_i, y_i) = \begin{cases} 
1.0 & \text{if } x_i = y_i \\
0.0 & \text{if } x_i \neq y_i 
\end{cases}$$

### 3.3. Normalized Weighted Overall Score
When only a subset of dimensions are answered by both users, similarity is normalized against the sum of observed weights:

$$\text{Similarity Score} = \left( \frac{\sum_{i \in \text{Observed}} w_i \cdot s_i}{\sum_{i \in \text{Observed}} w_i} \right) \times 100$$

### 3.4. Data Coverage Metric & Sufficiency Threshold
To prevent two users with only a single shared question (e.g. both chose V60) from receiving a superficial 100% match, the engine computes a **Coverage Score**:

$$\text{Coverage Score} = \left( \frac{\sum_{i \in \text{Observed}} w_i}{\sum_{i \in \text{Total}} w_i} \right) \times 100$$

- **Minimum Coverage Threshold**: A pair must achieve at least **$40\%$ Coverage** to be deemed eligible for the Top 5 Twins ranking.
- If coverage is below $40\%$, the pair is excluded from similarity rankings until sufficient profile data is completed.

---

## 4. Stable Tie-Breaking Protocol

When multiple candidate matches produce identical similarity percentages, rankings are deterministically resolved in the following order:

1. **Similarity Score** ($\downarrow$ Descending)
2. **Coverage Score** ($\downarrow$ Descending: users with more comprehensively completed profiles take precedence)
3. **Candidate UUID / Username** ($\uparrow$ Ascending: canonical lexicographical sorting guarantees zero random jitter between page loads)

---

## 5. Transparency & Ethical Disclaimer

This algorithm is designed for playful community personality discovery and shared-interest icebreaking. **It does not measure psychological, scientific, or romantic compatibility.**
