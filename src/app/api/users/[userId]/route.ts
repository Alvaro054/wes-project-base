import { Types } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { ErrorResponse, getCart, GetCartResponse } from '@/lib/handlers'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse<GetCartResponse> | NextResponse<ErrorResponse>> {
  if (!Types.ObjectId.isValid(params.userId)) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'Invalid user ID.',
      },
      { status: 400 }
    )
  }

  const cart = await getCart(params.userId)

  if (cart === null) {
    return NextResponse.json(
      {
        error: 'NOT_FOUND',
        message: 'User not found.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json(cart)
}