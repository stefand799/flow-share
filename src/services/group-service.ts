import { PrismaClient, Group, GroupMember, User} from "../generated/prisma";

const prisma = new PrismaClient();
type EnrichedGroupMember = GroupMember & { user: User };

export const createGroup = async (group: Group): Promise<Group | null> => {

    const existingGroup = await prisma.group.findFirst({where: {name: group.name}});
    
    if (existingGroup) return null; 

    const createdGroup = await prisma.group.create({
        data: {
            name: group.name,
            description: group.description,
        },
    });

    return createdGroup; 
};

export const updateGroup = async (group: Group): Promise<Group | null> => {
    const existingGroup = await prisma.group.findFirst({where: {id:group.id}});
    if(!existingGroup) return null;

    const updatedGroup = await prisma.group.update({
        where: {id: group.id},
        data:{
            name : group.name,
            description: group.description,
            whatsappGroupUrl: group.whatsappGroupUrl
        }
    });
    return updatedGroup;
};

export const deleteGroup = async (group: Group): Promise<boolean> => {
    const existingGroup = await prisma.group.findFirst({where: {id:group.id}});
    if(!existingGroup) return false;
    
    await prisma.group.delete({where: {id: group.id}});
    return true;
};

export const addMember = async (member: GroupMember): Promise<GroupMember | null> => {
    const existingMember = await prisma.groupMember.findFirst({where: {userId: member.userId, groupId: member.groupId}});
    if(existingMember) return null;

    const createdMember = await prisma.groupMember.create({
        data:{
            userId: member.userId,
            groupId: member.groupId,
        }
    });
    return createdMember;
};

export const removeMember = async (member: GroupMember): Promise<boolean> =>{
    const existingMember = await prisma.groupMember.findFirst({where: {id: member.id},});
    if(!existingMember) return false;

    await prisma.groupMember.delete({where: {id: member.id}});
    return true;
};

export const promoteAdmin = async (member: GroupMember): Promise<GroupMember | null> => {
    const existingMember = await prisma.groupMember.findFirst({where: {id: member.id}});
    if(!existingMember) return null;

    const promotedMember = await prisma.groupMember.update({
        where: {id: member.id},
        data:{
            isAdmin : true
        }
    });
    return promotedMember;
};

export const demoteAdmin = async (member: GroupMember): Promise<GroupMember | null> => {
    const existingMember = await prisma.groupMember.findFirst({where: {id: member.id}});
    if(!existingMember) return null;

    const demotedMember = await prisma.groupMember.update({
        where: {id: member.id},
        data:{
            isAdmin : false
        }
    });
    return demotedMember;
};

export const getGroups = async (user: User): Promise<Group[]> => {
    const groupMemberships = await prisma.groupMember.findMany({
        where: {
            userId: user.id,
        },
        include: {
            group: true, 
        },
    });

    const groups = groupMemberships.map(membership => membership.group);

    return groups;
};


export const getGroupMembers = async (groupId: number): Promise<EnrichedGroupMember[]> => {
    const groupMemberships = await prisma.groupMember.findMany({
        where: {
            groupId: groupId,
        },
        include: {
            user: true,
        },
    });

    return groupMemberships as EnrichedGroupMember[];
};

export const getGroupById = async (groupId: number): Promise<Group | null> => {
    // Corrected the variable name from 'groupid' to 'groupId'
    const group = await prisma.group.findFirst({
        where: { id: groupId }, // Correct capitalization
    });

    // Explicitly return the found group or null if not found
    return group;
};

