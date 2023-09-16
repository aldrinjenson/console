import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	TextInput,
	Tooltip,
	px,
	rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';
import { useUsersStyles } from './styles';
import { useGetRole } from '@/hooks/useGetRole';
import { useDeleteRole } from '@/hooks/useDeleteRole';
import { usePutRole } from '@/hooks/usePutRole';
import { useGetLogStreamList } from '@/hooks/useGetLogStreamList';

interface PrivilegeTRProps {
	roleName: string;
	getRolesList: () => void;
}

const PrivilegeTR: FC<PrivilegeTRProps> = (props) => {
	const { roleName, getRolesList } = props;

	const [UserInput, setUserInput] = useState<string>('');

	// Delete Privilege Modal Constants  : Starts
	const [deletePrivilegeIndex, setDeletePrivilegeIndex] = useState<number>(0);
	const [isDeletedPrivilegeOpen, { open: openDeletePrivilege, close: closeDeletePrivilege }] = useDisclosure();
	// Delete Privilege Modal Constants  : Ends

	// Delete Role Modal Constants  : Starts
	const [isDeletedRoleOpen, { open: openDeleteRole, close: closeDeleteRole }] = useDisclosure();
	// Delete Role Modal Constants  : Ends

	// Update Role Modal Constants  : Starts
	const [isUpdatedRoleOpen, { open: openUpdateRole, close: closeUpdateRole }] = useDisclosure();
	const [selectedPrivilege, setSelectedPrivilege] = useState<string>('');
	const [SelectedStream, setSelectedStream] = useState<string>('');
	const [streamSearchValue, setStreamSearchValue] = useState<string>('');
	const [tagInput, setTagInput] = useState<string>('');
	const { data: streams } = useGetLogStreamList();
	// Update Role Modal Constants  : Ends

	const {
		data: privileges,
		error: getRolePrivilegeError,
		loading: getRolePrivilegeLoading,
		getRolePrivilege,
		resetData: resetGetRolePrivilegeData,
	} = useGetRole();

	const { data: DeleteRoleResponse, deleteRoleFun, resetData: resetDeleteRoleData } = useDeleteRole();

	const { data: UpdatedRoleResponse, putRolePrivilege, resetData: resetUpdatedRoleData } = usePutRole();

	useEffect(() => {
		getRolePrivilege(roleName);

		return () => {
			resetGetRolePrivilegeData();
		};
	}, []);

	useEffect(() => {
		getRolePrivilege(roleName);

		return () => {
			resetUpdatedRoleData();
		};
	}, [UpdatedRoleResponse]);

	const getBadge = (privilege: any, i: number, withAction: boolean) => {
		if (privilege.privilege === 'admin' || privilege.privilege === 'editor') {
			return (
				<Badge color="violet" rightSection={withAction ? removeButton(i) : ''} variant={'light'}>
					{privilege.privilege}
				</Badge>
			);
		}

		if (privilege.privilege === 'reader') {
			if (privilege.resource?.tag) {
				return (
					<Badge color="orange" rightSection={withAction ? removeButton(i) : ''} variant={'light'}>
						{privilege.privilege} of {privilege.resource?.stream === '*' ? 'All' : privilege.resource?.stream} with{' '}
						{privilege.resource?.tag}
					</Badge>
				);
			}
			return (
				<Badge color="orange" rightSection={withAction ? removeButton(i) : ''} variant={'light'}>
					{privilege.privilege} of {privilege.resource?.stream === '*' ? 'All' : privilege.resource?.stream}
				</Badge>
			);
		}
		return (
			<Badge color="blue" rightSection={withAction ? removeButton(i) : ''} variant={'light'}>
				{privilege.privilege} of {privilege.resource?.stream === '*' ? 'All' : privilege.resource?.stream}
			</Badge>
		);
	};

	const removeButton = (i: number) => (
		<ActionIcon
			size="xs"
			color="blue"
			radius="xl"
			variant="transparent"
			onClick={() => {
				openDeletePrivilege();
				setDeletePrivilegeIndex(i);
			}}>
			<IconX size={rem(10)} />
		</ActionIcon>
	);

	const handleClosePrivilegeDelete = () => {
		closeDeletePrivilege();
		setUserInput('');
	};

	const handlePrivilegeDelete = () => {
		const newPrivileges = privileges?.filter((privilege: any, i: number) => {
			if (i !== deletePrivilegeIndex){
				return privilege;
			}
		});

		putRolePrivilege(roleName, newPrivileges);

		handleClosePrivilegeDelete();
	};

	const getBadges = (userRole: any) => {
		if (userRole.length > 0) {
			const Badges = userRole.map((privilege: any, i: number) => {
				return <span key={i}> {getBadge(privilege, i, true)}</span>;
			});
			return Badges;
		} else {
			return (
				<Badge color="red" variant={'light'}>
					No Role
				</Badge>
			);
		}
	};

	const handleDelete = () => {
		deleteRoleFun(roleName);
		handleCloseDelete();
	};

	const handleCloseDelete = () => {
		closeDeleteRole();
		setUserInput('');
	};
	useEffect(() => {
		if (DeleteRoleResponse) {
			getRolesList();
			resetDeleteRoleData();
		}
	}, [DeleteRoleResponse]);

	const handleCloseUpdateRole = () => {
		closeUpdateRole();
		setSelectedPrivilege('');
		setSelectedStream('');
		setStreamSearchValue('');
		setTagInput('');
	};

	const handleUpadterole = () => {
		if (selectedPrivilege === 'admin' || selectedPrivilege === 'editor') {
			privileges?.push({
				privilege: selectedPrivilege,
			});
		}
		if (selectedPrivilege === 'reader' || selectedPrivilege === 'writer') {
			if (streams?.find((stream) => stream.name === SelectedStream)) {
				if (tagInput !== '' && tagInput !== undefined && selectedPrivilege !== 'writer') {
					privileges?.push({
						privilege: selectedPrivilege,
						resource: {
							stream: SelectedStream,
							tag: tagInput,
						},
					});
				} else {
					privileges?.push({
						privilege: selectedPrivilege,
						resource: {
							stream: SelectedStream,
						},
					});
				}
			}
		}
		putRolePrivilege(roleName, privileges);
		handleCloseUpdateRole();
	};

	const updateRoleVaildtion = () => {
		if (selectedPrivilege === 'admin' || selectedPrivilege === 'editor') {
			if (privileges?.find((role: any) => role.privilege === selectedPrivilege)) {
				return true;
			}
			return false;
		}
		if (selectedPrivilege === 'reader') {
			if (
				privileges?.find(
					(role: any) =>
						role.privilege === selectedPrivilege &&
						role.resource?.stream === SelectedStream &&
						(tagInput
							? role.resource?.tag === tagInput
							: role.resource?.tag === null || role.resource?.tag === undefined),
				)
			) {
				return true;
			}
			if (
				streams?.find((stream) => stream.name === SelectedStream) &&
				SelectedStream !== '' &&
				SelectedStream !== undefined
			) {
				return false;
			}
			return true;
		}
		if (selectedPrivilege === 'writer') {
			if (
				privileges?.find(
					(role: any) => role.privilege === selectedPrivilege && role.resource?.stream === SelectedStream,
				)
			) {
				return true;
			}
			if (
				streams?.find((stream) => stream.name === SelectedStream) &&
				SelectedStream !== '' &&
				SelectedStream !== undefined
			) {
				return false;
			}
			return true;
		}
		return true;
	};

	const { classes } = useUsersStyles();
	return (
		<>
			<tr className={classes.trStyle}>
				<td>{roleName}</td>
				<td>
					{getRolePrivilegeError ? (
						'Error'
					) : getRolePrivilegeLoading ? (
						'loading..'
					) : privileges ? (
						<>
							{getBadges(privileges)}
							<Tooltip
								label={'Add a Privilege'}
								sx={{ color: 'white', backgroundColor: 'black' }}
								withArrow
								position="right">
								<Badge color="green">
									<IconPlus size={rem(10)} onClick={openUpdateRole} />
								</Badge>
							</Tooltip>
						</>
					) : (
						<Badge color="red">Error</Badge>
					)}
				</td>
				<td>
					<Box style={{ height: '100%', width: '100%', whiteSpace: 'nowrap', textAlign: 'center' }}>
						<Tooltip label={'Delete'} sx={{ color: 'white', backgroundColor: 'black' }} withArrow position="right">
							<Button
								variant="default"
								className={classes.actionBtn}
								aria-label="Delete user"
								onClick={() => {
									openDeleteRole();
								}}>
								<IconTrash size={px('1.2rem')} stroke={1.5} />
							</Button>
						</Tooltip>
					</Box>
				</td>
			</tr>
			<Modal
				withinPortal
				size="md"
				opened={isDeletedRoleOpen}
				onClose={handleCloseDelete}
				title={'Delete Role'}
				className={classes.modalStyle}
				centered>
				<TextInput
					label="Are you sure you want to delete this Role?"
					type="text"
					onChange={(e) => {
						setUserInput(e.target.value);
					}}
					placeholder={`Please enter the Role to confirm, i.e. ${roleName}`}
					required
				/>

				<Group position="right" mt={10}>
					<Button
						variant="filled"
						color="gray"
						className={classes.modalActionBtn}
						disabled={UserInput === roleName ? false : true}
						onClick={handleDelete}>
						Delete
					</Button>
					<Button onClick={handleCloseDelete} variant="outline" color="gray" className={classes.modalCancelBtn}>
						Cancel
					</Button>
				</Group>
			</Modal>
			{privileges && privileges[deletePrivilegeIndex] ? (
				<Modal
					withinPortal
					size="md"
					opened={isDeletedPrivilegeOpen}
					onClose={handleClosePrivilegeDelete}
					title={'Delete Privilege'}
					centered
					className={classes.modalStyle}>
					<Stack>
						<Text>{getBadge(privileges[deletePrivilegeIndex], deletePrivilegeIndex, false)}</Text>
						<TextInput
							label="Are you sure you want to delete this role privilege?"
							type="text"
							onChange={(e) => {
								setUserInput(e.target.value);
							}}
							placeholder={`Please enter the role to confirm, i.e. ${roleName}`}
							required
						/>
					</Stack>

					<Group position="right" mt={10}>
						<Button
							variant="filled"
							color="gray"
							className={classes.modalActionBtn}
							disabled={UserInput === roleName ? false : true}
							onClick={handlePrivilegeDelete}>
							Delete
						</Button>
						<Button onClick={handleClosePrivilegeDelete} variant="outline" color="gray" className={classes.modalCancelBtn}>
							Cancel
						</Button>
					</Group>
				</Modal>
			) : (
				''
			)}
			<Modal
				opened={isUpdatedRoleOpen}
				onClose={handleCloseUpdateRole}
				title="Add Privilege"
				centered
				className={classes.modalStyle}>
				<Stack>
					<Select
						placeholder="Select privilege"
						label="Select a privilege to assign"
						data={['admin', 'editor', 'writer', 'reader']}
						onChange={(value) => {
							setSelectedPrivilege(value ?? '');
						}}
						value={selectedPrivilege}
						nothingFound="No options"
					/>

					{selectedPrivilege === 'reader' || selectedPrivilege === 'writer' ? (
						<>
							<Select
								placeholder="Pick one"
								onChange={(value) => {
									setSelectedStream(value ?? '');
								}}
								nothingFound="No options"
								value={SelectedStream}
								searchValue={streamSearchValue}
								onSearchChange={(value) => setStreamSearchValue(value)}
								onDropdownClose={() => setStreamSearchValue(SelectedStream)}
								onDropdownOpen={() => setStreamSearchValue('')}
								data={streams?.map((stream) => ({ value: stream.name, label: stream.name })) ?? []}
								searchable
								label="Select a stream to assign"
								required
							/>
							{selectedPrivilege === 'reader' ? (
								<TextInput
									type="text"
									placeholder={`Please enter the Tag.`}
									label="Tag"
									onChange={(e) => {
										setTagInput(e.target.value);
									}}
								/>
							) : (
								''
							)}
						</>
					) : (
						''
					)}
				</Stack>

				<Group position="right" mt={10}>
					<Button
						variant="filled"
						color="gray"
						className={classes.modalActionBtn}
						disabled={updateRoleVaildtion()}
						onClick={handleUpadterole}>
						Add privilege
					</Button>
					<Button onClick={handleCloseUpdateRole} variant="outline" color="gray" className={classes.modalCancelBtn}>
						Cancel
					</Button>
				</Group>
			</Modal>
		</>
	);
};

export default PrivilegeTR;