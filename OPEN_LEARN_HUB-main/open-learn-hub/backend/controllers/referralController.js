// Generate referral code
export async function generateReferralCode(req, res) {
  const Referral = (await import('../models/Referral.js')).default
  try {
    // Check if user already has active referral codes
    const existingCodes = await Referral.find({
      referrer: req.user.id,
      status: { $ne: 'expired' }
    }).countDocuments()
    
    if (existingCodes >= 10) {
      return res.status(400).json({ message: 'Maximum 10 active referral codes allowed' })
    }
    
    const referral = await Referral.create({
      referrer: req.user.id,
      reward: {
        type: 'premium-days',
        value: 7
      },
      refereeReward: {
        type: 'premium-days',
        value: 3
      },
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    })
    
    res.status(201).json(referral)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get my referral codes
export async function getMyReferrals(req, res) {
  const Referral = (await import('../models/Referral.js')).default
  try {
    const referrals = await Referral.find({ referrer: req.user.id })
      .populate('referee', 'name email')
      .sort({ createdAt: -1 })
    
    const stats = {
      totalReferrals: referrals.length,
      completed: referrals.filter(r => r.status === 'completed').length,
      pending: referrals.filter(r => r.status === 'pending').length,
      totalRewardsClaimed: referrals.filter(r => r.reward.claimed).length,
      totalPremiumDaysEarned: referrals
        .filter(r => r.reward.claimed && r.reward.type === 'premium-days')
        .reduce((sum, r) => sum + r.reward.value, 0)
    }
    
    res.json({ referrals, stats })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Apply referral code (during signup/onboarding)
export async function applyReferralCode(req, res) {
  const Referral = (await import('../models/Referral.js')).default
  try {
    const { code } = req.body
    
    const referral = await Referral.findOne({
      code,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
    
    if (!referral) {
      return res.status(404).json({ message: 'Invalid or expired referral code' })
    }
    
    // Check if user hasn't been referred before
    const existingReferral = await Referral.findOne({ referee: req.user.id })
    if (existingReferral) {
      return res.status(400).json({ message: 'Referral code already applied' })
    }
    
    // Update referral
    referral.referee = req.user.id
    referral.status = 'completed'
    referral.registeredAt = new Date()
    
    // Mark referee reward as ready
    referral.refereeReward.claimed = false
    
    await referral.save()
    
    res.json({
      message: 'Referral code applied successfully',
      reward: referral.refereeReward
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Claim referral reward
export async function claimReward(req, res) {
  const Referral = (await import('../models/Referral.js')).default
  try {
    const referral = await Referral.findById(req.params.id)
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' })
    }
    
    // Check if user is eligible
    const isReferrer = referral.referrer.toString() === req.user.id.toString()
    const isReferee = referral.referee && referral.referee.toString() === req.user.id.toString()
    
    if (!isReferrer && !isReferee) {
      return res.status(403).json({ message: 'Not authorized to claim this reward' })
    }
    
    let rewardToClaim
    if (isReferrer && !referral.reward.claimed && referral.status === 'completed') {
      rewardToClaim = referral.reward
      referral.reward.claimed = true
      referral.reward.claimedAt = new Date()
    } else if (isReferee && !referral.refereeReward.claimed) {
      rewardToClaim = referral.refereeReward
      referral.refereeReward.claimed = true
    } else {
      return res.status(400).json({ message: 'Reward already claimed or not available' })
    }
    
    await referral.save()
    
    // Apply reward to user (you can extend this based on reward type)
    if (rewardToClaim.type === 'premium-days') {
      // Logic to add premium days to user account
      // This would update User model with premium expiry date
    }
    
    res.json({
      message: 'Reward claimed successfully',
      reward: rewardToClaim
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Track referral link click
export async function trackReferralClick(req, res) {
  const Referral = (await import('../models/Referral.js')).default
  try {
    const { code } = req.params
    
    const referral = await Referral.findOne({ code })
    
    if (referral) {
      referral.metadata.clicks++
      referral.metadata.lastClickedAt = new Date()
      await referral.save()
    }
    
    res.json({ message: 'Click tracked' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get referral leaderboard
export async function getReferralLeaderboard(req, res) {
  const Referral = (await import('../models/Referral.js')).default
  try {
    const leaderboard = await Referral.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$referrer',
          totalReferrals: { $sum: 1 },
          totalRewardsClaimed: {
            $sum: { $cond: ['$reward.claimed', 1, 0] }
          }
        }
      },
      { $sort: { totalReferrals: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          totalReferrals: 1,
          totalRewardsClaimed: 1
        }
      }
    ])
    
    res.json(leaderboard)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Delete referral code
export async function deleteReferralCode(req, res) {
  const Referral = (await import('../models/Referral.js')).default
  try {
    const referral = await Referral.findOneAndDelete({
      _id: req.params.id,
      referrer: req.user.id,
      status: 'pending'
    })
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral code not found or cannot be deleted' })
    }
    
    res.json({ message: 'Referral code deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
