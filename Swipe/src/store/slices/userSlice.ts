import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserRole } from '../../types'

interface UserState {
  role: UserRole | null;
  isRoleSelected: boolean;
}

const initialState: UserState = {
  role: null,
  isRoleSelected: false
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    selectRole: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload
      state.isRoleSelected = true
    },
    clearRole: (state) => {
      state.role = null
      state.isRoleSelected = false
    }
  }
})

export const { selectRole, clearRole } = userSlice.actions
export default userSlice.reducer
