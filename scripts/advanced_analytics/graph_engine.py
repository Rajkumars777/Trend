
import random

class GraphEngine:
    """
    Heterogeneous Graph Neural Network (GNN) Engine.
    Models relationships: User -> Discusses -> Commodity -> Sold_At -> Mandi.
    Predicts 'Viral Risk' and 'Supply Chain Impact'.
    """
    
    def __init__(self):
        # Mock Graph Structure (Adjacency List)
        self.graph = {
            "Influencers": ["KisanUnionLeader", "AgriExpert_IN"],
            "Commodities": ["Onion", "Wheat", "Tomato"],
            "Mandis": ["Nashik", "Azadpur", "Lasalgaon"]
        }
        
    def propagate_risk(self, topic, sentiment_score, user_influence_score=0.5, timestamp=None):
        """
        TEMPORAL GRAPH NETWORK (TGN) Simulation.
        Calculates Risk based on DYNAMIC Influence Velocity.
        
        New Logic: 
        Risk = Sentiment * (User_Score * Time_Decay)
        """
        impact_score = 0.0
        
        # 1. Temporal Dynamics (Velocity)
        # Simulate: Is this user gaining influence recently?
        # Mocking a "Memory State" lookup
        previous_influence = user_influence_score * 0.9 
        influence_velocity = user_influence_score - previous_influence # Rising star?
        
        # 2. Viral Propagation Prediction (HetInf Model)
        # If sentiment is highly negative and user is influence is RISING -> CRITICAL
        weighted_sentiment = sentiment_score * (1 + user_influence_score + influence_velocity)
        
        if weighted_sentiment < -0.8 and influence_velocity > 0.05:
            risk_level = "CRITICAL (Viral Spike)"
            impact_score = 0.98
        elif weighted_sentiment < -0.5:
            risk_level = "HIGH"
            impact_score = 0.75
        else:
            risk_level = "NORMAL"
            impact_score = 0.2
            
        return {
            "viral_risk": risk_level,
            "influence_velocity": "RISING" if influence_velocity > 0 else "STABLE",
            "supply_chain_impact_prob": impact_score,
            "affected_nodes": self._find_connected_mandis(topic)
        }
        
    def _find_connected_mandis(self, commodity):
        """ Traverses graph edges: Commodity -> Mandi """
        # Mock Knowledge Graph lookup
        if "Onion" in commodity:
            return ["Nashik", "Lasalgaon"]
        elif "Wheat" in commodity:
            return ["Azadpur", "Punjab_Mandi"]
        return ["General_Market"]
