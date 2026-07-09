import prisma from "../../config/database.js";

export const deviceService = {

    //Create a new Device
   async createDevice(deviceData) {
    return await prisma.device.create({
      data: {
        ...deviceData
      }
    });
  },

    //Get All device for specific user
    async getDevices(userId){
        return prisma.device.findMany({
            where : {userId},
            orderBy : {createdAt : 'desc'},
        })
    },

    //Update an existing device
    async updateDevice(userId,id,data){
        const device = await this.getDevices(userId,id)
        if(!device) return null;
        
        return prisma.device.update({
            where : {id},
            data,
        });
    },

    async deleteDevice(userId,id){
        const device = await this.getDeviceById(userId,id);
        if(!device) return null;

        return prisma.device.delete({
            where : {id},
        });
    },
};