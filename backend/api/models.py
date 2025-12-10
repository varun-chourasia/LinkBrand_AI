from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from api.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    # Unique constraints ensure no duplicate users
    email = Column(String, unique=True, index=True, nullable=True) 
    linkedin_id = Column(String, unique=True, index=True)
    name = Column(String)
    pic_url = Column(String)
    
    # JSON Data stored as a large text string
    profile_summary = Column(Text, default="{}") 
    
    # Relationship to Posts (One User -> Many Posts)
    posts = relationship("Post", back_populates="owner")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    # Foreign Key links this post to a specific user ID
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="posts")