import React from "react";
import { useParams } from "react-router-dom";
import Room from "./Room"; 

const ClientRoom = ({ userNo, socket, setUsers, setUserNo, user }) => {
  const { roomId } = useParams(); 
  const userRoomId = user?.roomId;
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Room Render Portal
        </h1>

        {roomId && userRoomId && roomId === userRoomId ? (

          <Room
            userNo={userNo}
            socket={socket}
            setUsers={setUsers}
            setUserNo={setUserNo}
            user={user}
          />
        ) : (
          
          <div className="text-center text-red-500 font-semibold text-xl">
            You are not in this room!
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRoom;
